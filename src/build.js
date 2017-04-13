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
import {getDbAndCollection} from './mongo';

const cacheDir = '/tmp/.gsm-search-cache';
const listCachePath = path.join(cacheDir, 'list.json');
const detailsCachePath = path.join(cacheDir, 'details');
const detailsConvertedCachePath = path.join(cacheDir, 'details-converted');

fs.mkdirpSync(cacheDir);
fs.mkdirpSync(detailsCachePath);
fs.mkdirpSync(detailsConvertedCachePath);

var argv = parseArgs(process.argv.slice(2), {
  alias: {
    h: 'help',
    l: 'list',
    f: 'force',
    F: 'forceAll'
  },
  boolean: ['help', 'list', 'forceAll']
});

const usage = `
build [-h][-f <l|d|c>][-F]
 -h - help
 -f - clear type cache l -> list, d -> details, c -> details-converted
 -F - clear all caches
`

if (argv.help) {
  console.log(usage);
  process.exit();
}

let pathsToRemove = [];
if (argv.force) {
  const pathToRemove = {
    'l': listCachePath,
    'd': detailsCachePath,
    'c': detailsConvertedCachePath
  }[argv.force];
  if (!pathToRemove) {
    console.error(`${argv.force} is not a valid argument to -f`);
    process.exit(1);
  }
  pathsToRemove = [pathToRemove];
}
if (argv.forceAll) {
  pathsToRemove = [listCachePath, detailsCachePath, detailsConvertedCachePath];
}
pathsToRemove.forEach(cachePath => {
  const exists = fs.existsSync(cachePath);
  if (!exists) return;

  const stat = fs.statSync(cachePath);
  if (stat.isDirectory()) {
    fs.emptyDirSync(cachePath);
  } else {
    fs.unlinkSync(cachePath);
  }
});


const PHONES_URL = (() => {
  const d = new Date();
  const cacheStr = `${d.getMonth()}${Math.round((d.getDate() * 24 + d.getHours()) / 6)}`;
  return `http://www.gsmarena.com/quicksearch-${cacheStr}.jpg`;
})();
const DETAILS_URL = "http://www.gsmarena.com/phone-widget.php3?idPhone=";

// utility
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


const getList = async () => {
  const filename = listCachePath;
  if (fs.existsSync(filename)) {
    return fs.readJsonSync(filename);
  }

  const [makers, phones] = await fetch(PHONES_URL).then((r) => r.json());
  const list = phones.map(([maker_id, phone_id, phone_name, search_str, thumb]) => {
    return {
      maker_id,
      maker_name: makers[maker_id],
      phone_id,
      phone_name,
      search_str,
      thumb
    }
  });
  fs.writeJsonSync(filename, list);
  return list;
}

const GET_DETAIL_HTML_MAX_ERRORS = 2;
const getDetailsHtml = async (id, errorCount=0) => {
  const filename = path.join(detailsCachePath, id + '.html');
  if (fs.existsSync(filename)) {
    return fs.readFileSync(filename, 'utf-8');
  }
  
  try {
    const detailsHtml = await fetch(`${DETAILS_URL}${id}`).then(r => r.text());
    fs.writeFileSync(filename, detailsHtml);
    return detailsHtml;
  
  } catch (e) {
    if (errorCount > GET_DETAIL_HTML_MAX_ERRORS) {
      throw e
    }
    return getDetailsHtml(id, errorCount + 1);
  }
};

const getDetails = async (id) => {
  const filename = path.join(detailsConvertedCachePath, id + '.json');
  if (fs.existsSync(filename)) {
    return fs.readJsonSync(filename);
  }
  const list = await getList();
  const item = list.filter(item => item.phone_id == id)[0];
  const detailsHtml = await getDetailsHtml(id);
  const details = convertDetailsHtml(detailsHtml);
  const detailsCombined = {
    ...details,
    ...item
  };
  fs.writeJsonSync(filename, detailsCombined);
  return detailsCombined;
}


// converters. these should be at runtime
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



const build = async () => {
  let list = await getList();

  const loadingDetailsBar = new ProgressBar({
    schema: 'fetched :current/:total :bar',
    total: list.length,
    clear: true
  });

  const detailsList = await new Promise((resolve, reject) => {
    async.series(list.map(item => callback => {
      loadingDetailsBar.tick();
      getDetails(item.phone_id)
        .then(details => { callback(null, details) })
        .catch(e => { callback(e) });
    }), (error, detailsList) => {
      if (error) return reject(error);
      resolve(detailsList);
    })
  });

  let [db, collection] = await getDbAndCollection();
  
  try {
    await collection.drop();
  } catch (e) {
    // dont care
  }
  
  const insertingDetailsBar = new ProgressBar({
    schema: 'inserted :current/:total :bar',
    total: detailsList.length,
    clear: true
  });

  const insertOne = async (details, errorCount=0) => {
    const {phone_id} = details;
    const existing = await collection.findOne({ phone_id: {$eq: phone_id} });
    if (existing) return;
    await collection.insertOne(details);
  }

  await new Promise((resolve, reject) => {
    async.series(detailsList.map(details => callback => {
      insertingDetailsBar.tick();
      insertOne(details)
        .then(() => { callback() })
        .catch(e => { callback(e) });
    }), (error) => {
      if (error) return reject(error);
      resolve();
    });
  });

  await db.close();
  console.log('Wrote to db');
  process.exit();
}

build().catch(e => {
  console.error(e);
  process.exit(1);
});
