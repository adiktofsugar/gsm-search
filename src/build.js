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

const cacheDir = path.resolve(__dirname, '..', '.gsm-search-cache');
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
 -f - clear type cache l -> list, d -> details (and converted), c -> details-converted
 -F - clear all caches
`

if (argv.help) {
  console.log(usage);
  process.exit();
}

let pathsToRemove = [];
if (argv.force) {
  pathsToRemove = {
    'l': [listCachePath],
    'd': [detailsCachePath, detailsConvertedCachePath],
    'c': [detailsConvertedCachePath]
  }[argv.force];
  if (!pathsToRemove) {
    console.error(`${argv.force} is not a valid argument to -f`);
    process.exit(1);
  }
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
  const convertedFilename = path.join(detailsConvertedCachePath, id + '.json');
  if (fs.existsSync(filename)) {
    return fs.readFileSync(filename, 'utf-8');
  }
  
  try {
    const detailsHtml = await fetch(`${DETAILS_URL}${id}`).then(r => r.text());
    fs.writeFileSync(filename, detailsHtml);
    // since getDetails is from this data, and that also writes a file,
    //   I'm going to delete the derived file too
    fs.existsSync(convertedFilename) && fs.unlinkSync(convertedFilename);
    return detailsHtml;
  
  } catch (e) {
    if (errorCount > GET_DETAIL_HTML_MAX_ERRORS) {
      throw e
    }
    return getDetailsHtml(id, errorCount + 1);
  }
};

const getDetails = async (id, item) => {
  const filename = path.join(detailsConvertedCachePath, id + '.json');
  if (fs.existsSync(filename)) {
    return fs.readJsonSync(filename);
  }
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

const convertResolution = (resolutionString) => {
  // 176 x 208 pixels, 2.1 inches, 35 x 41 mm (~130 ppi pixel density)
  const pixelsMatch = resolutionString.match(/([\dx\s]+)\spixels/)
  const pixelsDims = pixelsMatch && pixelsMatch[1].split(/\sx\s/)
  const pixels = {
    width: pixelsDims ? parseInt(pixelsDims[0], 10) : null,
    height: pixelsDims ? parseInt(pixelsDims[1], 10) : null
  };
  const inchesMatch = resolutionString.match(/([\d\.]+)\sinches/);
  const inches = inchesMatch && parseInt(inchesMatch[1], 10);
  const densityMatch = resolutionString.match(/~?([\d+])\sppi pixel density/);
  const density = densityMatch && parseInt(densityMatch[1], 10);
  return {
    raw: resolutionString,
    pixels,
    inches,
    density
  };
}
const convertMemory = (memoryString) => {
  const kbMatch = memoryString.match(/(\d+)\s*KB RAM/);
  const mbMatch = memoryString.match(/(\d+)\s*MB RAM/);
  const gbMatch = memoryString.match(/(\d+)\s*GB RAM/);
  let kb = kbMatch && kbMatch[1];
  if (mbMatch) {
    kb = parseInt(mbMatch[1], 10) * 1000;
  }
  if (gbMatch) {
    kb = parseInt(gbMatch[1], 10) * 1000000;
  }
  return {
    raw: memoryString,
    kb,
    mb: kb / 1000,
    gb: kb / 1000000
  };
}
const convertCamera = (cameraString) => {
  return cameraString;
}
const convertCpu = (cpuString) => {
  return cpuString;
}

const convertDetailsHtml = (markup) => {
  const options = {};
  const doc = jsdom(`<html><body><table>${markup}</table></body></html>`, options);
  const table = doc.documentElement.querySelector('body>table');
  doc.close();

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
    } else if (name == 'resolution') {
      value = convertResolution(value);
    } else if (name == 'memory') {
      value = convertMemory(value);
    }
    
    details[name] = value;
  });
  return details;
}



const build = async () => {
  const list = await getList();
  const phoneIds = list.map(details => parseInt(details.phone_id, 10));

  const [db, collection] = await getDbAndCollection();
  await collection.deleteMany({ phone_id: {$in: phoneIds}});

  const loadingDetailsBar = new ProgressBar({
    schema: 'fetched :current/:total :bar',
    total: phoneIds.length,
    clear: true
  });

  await Promise.all(list.map(async item => {
    loadingDetailsBar.tick();
    const details = await getDetails(item.phone_id, item);
    await collection.insertOne(details);
  }));
  
  await db.close();
  console.log('Wrote to db');
  process.exit();
}

build().catch(e => {
  console.error(e);
  process.exit(1);
});
