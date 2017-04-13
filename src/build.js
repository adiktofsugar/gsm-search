require('source-map-support').install({ environment: 'node' });
import "babel-polyfill";
import fetch from 'isomorphic-fetch'
import parseArgs from 'minimist';
import fs from 'fs-extra';
import path from 'path';
import Promise from 'promise';
import {jsdom} from 'jsdom';
import async from 'async';
import ProgressBar from 'ascii-progress';
import through from 'through2';
import stream from 'stream';
import minimatch from 'minimatch';
import {MongoClient} from 'mongodb';


const dbName = 'gsmSearch';
const dbUrl = `mongodb://localhost:27017/${dbName}`;

const cacheDir = '/tmp/.gsm-search-cache';
const listCachePath = path.join(cacheDir, 'list.json');
const detailsCachePath = path.join(cacheDir, 'details.json');
fs.mkdirpSync(cacheDir);

var argv = parseArgs(process.argv.slice(2), {
  alias: {
    h: 'help',
    l: 'list',
    f: 'forceList',
    F: 'forceAll'
  },
  boolean: ['help', 'list', 'force']
});

const usage = `
build [-h][-f][-F]
 -h - help
 -f - clear list cache
 -F - clear all caches
`

if (argv.help) {
  console.log(usage);
  process.exit();
}

let pathsToRemove = [];
if (argv.forceList) {
  pathsToRemove = [listCachePath];
}
if (argv.forceAll) {
  pathsToRemove = [listCachePath, detailsCachePath];
}
pathsToRemove.forEach(cachePath => {
  fs.existsSync(cachePath) && fs.unlinkSync(cachePath);
});


const PHONES_URL = (() => {
  const d = new Date();
  const cacheStr = `${d.getMonth()}${Math.round((d.getDate() * 24 + d.getHours()) / 6)}`;
  return `http://www.gsmarena.com/quicksearch-${cacheStr}.jpg`;
})();
const DETAILS_URL = "http://www.gsmarena.com/phone-widget.php3?idPhone=";


const fetchList = async () => {
  try {
    const [makers, phones] = await fetch(PHONES_URL).then((r) => r.json());
    return phones.map(([makerId, phoneId, name, searchStr, thumb]) => {
      return {
        maker_id: makerId,
        maker_name: makers[makerId],
        phone_id: phoneId,
        phone_name: name,
        search_str: searchStr,
        thumb
      }
    });
  } catch (e) {
    throw e;
  }
}

let cachedList = null;
const getList = async () => {
  if (cachedList) return cachedList;

  if (!fs.existsSync(listCachePath)) {
    try {
      const list = await fetchList();
      fs.writeFileSync(listCachePath, JSON.stringify(list, null, 2));
    } catch (e) {
      throw e;
    }
  }

  try {
    const json = fs.readFileSync(listCachePath, 'utf-8');
    cachedList = JSON.parse(json);
    return cachedList;
  } catch (e) {
    throw e
  }
}


// https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
const TEXT_NODE = 3;

const jsdomInnerText = (element) => {
  if (element.nodeType == TEXT_NODE) {
    return element.nodeValue;
  }
  let text = '';
  element.childNodes.forEach((node) => {
    text += jsdomInnerText(node);
  });
  return text;
}

const convertSize = (sizeAndWeightString) => {
  // 148.9 x 68.1 x 8 mm, 155 g
  const sizeAndWeightMatch = sizeAndWeightString.match(/\s*([0-9\.x\s]+)\s+mm,\s*(.+)/);
  
  let heightMm = null;
  let widthMm = null;
  let depthMm = null;
  if (sizeAndWeightMatch) {
    const sizeString = sizeAndWeightMatch[1].replace(/\s*x\s*/g, '=');
    const sizeParts = sizeString.split('=');
    heightMm = parseFloat(sizeParts[0]);
    widthMm = parseFloat(sizeParts[1]);
    depthMm = parseFloat(sizeParts[2]);
  }

  const weightString = (sizeAndWeightMatch)
    ? sizeAndWeightMatch[2]
    : '';
  let weightInGrams = weightString;
  const weightMatch = weightString.match(/\s*(\d+)\s*g\s*/);
  if (weightMatch) {
    const weightAmount = parseFloat(weightMatch[1]);
    const weightType = weightMatch[2];
    weightInGrams = weightAmount;
  }
  return {
    raw: sizeAndWeightString,
    height: heightMm,
    width: widthMm,
    depth: depthMm,
    weight: weightInGrams
  }
}

const convertDetailsHtml = (markup) => {
  const options = {};
  const doc = jsdom(`<html><body><table>${markup}</table></body></html>`, options);
  const table = doc.documentElement.querySelector('body>table');

  const details = {};
  const rows = Array.from(table.querySelectorAll('tr'));
  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    const [nameCell, valueCell] = cells;
    
    let name = jsdomInnerText(cells[0]);
    name = name.toLowerCase().replace(/\s+/g, '_');
    
    let value = jsdomInnerText(cells[1]);
    if (name == 'size') {
      value = convertSize(value);
    }
    
    details[name] = value;
  });
  return details;
}

let cachedDetailsHtml = null;
const getDetailsHtml = () => {
  if (!cachedDetailsHtml) {
    if (!fs.existsSync(detailsCachePath)) {
      fs.writeFileSync(detailsCachePath, '{}');
    }
    cachedDetailsHtml = fs.readFileSync(detailsCachePath, 'utf-8');
  }
  return JSON.parse(cachedDetailsHtml);
}

const FETCH_ONE_DETAIL_HTML_MAX_ERRORS = 2;
const fetchOneDetailsHtml = async (id, errorCount=0) => fetch(`${DETAILS_URL}${id}`)
  .then(r => r.text())
  .then(details => {
    const idToDetailsHtml = getDetailsHtml();
    idToDetailsHtml[id] = details;
    fs.writeFileSync(detailsCachePath, JSON.stringify(idToDetailsHtml));
    return idToDetailsHtml;
  })
  .catch(e => {
    if (errorCount > FETCH_ONE_DETAIL_HTML_MAX_ERRORS) {
      return e;
    }
    return fetchOneDetailsHtml(id, errorCount + 1);
  });


const fetchDetailsHtml = async (ids) => {
  if (!(ids instanceof Array)) {
    ids = [ids];
  }
  if (!ids.length) {
    return {};
  }

  const idToDetailsHtml = getDetailsHtml();
  const idsToFetch = [];
  ids.forEach(id => {
    if (!idToDetailsHtml[id]) {
      idsToFetch.push(id);
    }
  });

  const bar = new ProgressBar({
    schema: 'fetching :current/:total :bar',
    total: idsToFetch.length
  });
  return new Promise((resolve, reject) => {
    const fns = idsToFetch.map(id => (callback) => {
      fetchOneDetailsHtml(id)
        .then(() => {
          bar.tick();
          callback()
        })
        .catch(e => {
          console.error(`..failed to fetch ${id}`);
          callback(e)
        });
    });
    async.series(fns, (error) => {
      if (error) return reject(error);
      resolve();
    })
  });
}


const printList = async (ids) => {
  try {
    const phones = await getList();
    console.log('PHONES', JSON.stringify(phones, null, 2));
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
}

class IdStream extends stream.Readable {
  constructor(ids, options) {
    super(options);
    this._ids = ids;
    this._index = 0;
  }
  _read(size) {
    if (this._index >= this._ids.length) {
      this.push(null);
    } else {
      const buf = Buffer.from(String(this._ids[this._index]), 'ascii');
      this._index++;
      this.push(buf);
    }
  }
}

const createIdsStream = (ids) => {
  if (!(ids instanceof Array)) {
    ids = [ids];
  }
  return new IdStream(ids);
}

const createDetailsHtmlStream = async (ids) => {
  const list = await getList();
  return fetchDetailsHtml(ids)
  .then(() => {
    const idToDetailsHtml = getDetailsHtml();
    return createIdsStream(ids).pipe(through.obj((id, enc, callback) => {
      callback(null, {
        html: idToDetailsHtml[id],
        listItem: list.filter(item => item.phoneId == id)[0]
      });
    }));
  })
};

const createDetailsStream = async (ids) => {
  const detailsHtmlStream = await createDetailsHtmlStream(ids);
  return detailsHtmlStream.pipe(through.obj((detailsHtml, enc, callback) => {
    const {html, listItem} = detailsHtml;
    const details = convertDetailsHtml(html);
    callback(null, {
      ...listItem,
      ...details
    });
  }))
}
  

const build = async () => {
  let ids;
  try {
    const phones = await getList();
    ids = phones.map(phone => phone.phoneId);
  } catch (e) {
    throw e
  }

  // const numberOperator = (operatorFn) => (q, v) => {
  //   q = parseFloat(q);
  //   v = parseFloat(v);
  //   if (isNaN(q) || isNaN(v)) {
  //     return false;
  //   }
  //   return operatorFn(q, v);
  // }
  // const operators = {
  //   '=': (q, v) => v == q,
  //   '<': (q, v) => v < q,
  //   '>': (q, v) => v > q,
  //   '<=': (q, v) => v <= q,
  //   '>=': (q, v) => v >= q,
  //   '=~': (q, v) => {
  //     const re = minimatch.makeRe(q);
  //     //console.log(`${q} glob: ${v} re:${re}`)
  //     return re.test(v);
  //   }
  // };
  // Object.keys(operators).forEach(operator => {
  //   if (operator === '=~') return;
  //   const operatorFn = operators[operator];
  //   operators[operator] = numberOperator(operatorFn);
  // });
  // let matchFn = function () { return false };
  // const queryMatchers = queries.map(query => {
  //   const parts = query.split(/\s+/);
  //   const [attributeName, op, ...queryValueParts] = parts;
  //   const queryValue = queryValueParts.join(' ');
  //   if (!operators[op]) return matchFn;
  //   // if the query was "status = Accepted", the matcher function
  //   //   will be ("Accepted" == 
  //   const operatorFn = operators[op];
  //   return (details) => {

  //     // this makes "size.height" evaluate to details.size.height
  //     try {
  //       const attributeNameParts = attributeName.split('.');
  //       let attributeValue = details;
  //       for (let i = 0; i < attributeNameParts.length; i++) {
  //         attributeValue = attributeValue[attributeNameParts[i]];
  //         if (!attributeValue) break;
  //       }
  //       if (!attributeValue) return matchFn;
  //       return operatorFn(queryValue, attributeValue);

  //     } catch (e) {
  //       console.error(`Failed trying to match query "${query}" with "${JSON.stringify(details, null, 2)}"`)
  //       throw e;
  //     }
  //   }
  // });

  
  let db, collection, detailsStream;
  try {
    db = await new Promise((resolve, reject) => {
      MongoClient.connect(dbUrl, (error, db) => {
        if (error) return reject(error);
        resolve(db);
      });
    });
    collection = await new Promise((resolve, reject) => {
      db.collection('phones', (error, collection) => {
        if (error) return reject(error);
        resolve(collection);
      });
    });
    try {
      await collection.drop()
    } catch (e) {
      // i don't care if this fails
    }
    detailsStream = await createDetailsStream(ids);
  } catch (e) {
    throw e
  }

  const bar = new ProgressBar({
    schema: 'inserted :current/:total :bar',
    total: ids.length,
    clear: true
  });
  detailsStream
  .on('data', async (details) => {
    bar.tick();
    try {
      await collection.insertOne(details)
    } catch (e) {
      console.error("Failed inserting details...", e);
    }
  })
  .on('end', async () => {
    try {
      await db.close();
    } catch (e) {
      throw e
    }
    console.log('Wrote to db');
    process.exit();
  });
}

build().catch(e => {
  console.error(e);
  process.exit(1);
});
