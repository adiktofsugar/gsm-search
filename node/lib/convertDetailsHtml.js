const fs = require("fs-extra");
const path = require("path");
const { JSDOM } = require("jsdom");
const { listCachePath, detailsCachePath } = require("./cachePaths");

// utility
// https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
const TEXT_NODE = 3;
const jsdomInnerText = element => {
  if (element.nodeType === TEXT_NODE) {
    return element.nodeValue;
  }
  let text = "";
  element.childNodes.forEach(node => {
    text += jsdomInnerText(node);
  });
  return text;
};

// converters. these should be at runtime
const convertSize = sizeAndWeightString => {
  // 148.9 x 68.1 x 8 mm, 155 g
  const sizeAndWeightMatch = sizeAndWeightString.match(
    /\s*([0-9.x\s]+)\s+mm,\s*(.+)/
  );

  let heightMm = null;
  let widthMm = null;
  let depthMm = null;
  if (sizeAndWeightMatch) {
    const sizeString = sizeAndWeightMatch[1].replace(/\s*x\s*/g, "=");
    const sizeParts = sizeString.split("=");
    heightMm = parseFloat(sizeParts[0]);
    widthMm = parseFloat(sizeParts[1]);
    depthMm = parseFloat(sizeParts[2]);
  }

  const weightString = sizeAndWeightMatch ? sizeAndWeightMatch[2] : "";
  let weightInGrams = weightString;
  const weightMatch = weightString.match(/\s*(\d+)\s*g\s*/);
  if (weightMatch) {
    const weightAmount = parseFloat(weightMatch[1]);
    // const weightType = weightMatch[2];
    weightInGrams = weightAmount;
  }
  return {
    raw: sizeAndWeightString,
    height: heightMm,
    width: widthMm,
    depth: depthMm,
    weight: weightInGrams
  };
};

const convertResolution = resolutionString => {
  // 176 x 208 pixels, 2.1 inches, 35 x 41 mm (~130 ppi pixel density)
  const pixelsMatch = resolutionString.match(/([\dx\s]+)\spixels/);
  const pixelsDims = pixelsMatch && pixelsMatch[1].split(/\sx\s/);
  const pixels = {
    width: pixelsDims ? parseInt(pixelsDims[0], 10) : null,
    height: pixelsDims ? parseInt(pixelsDims[1], 10) : null
  };
  const inchesMatch = resolutionString.match(/([\d.]+)\sinches/);
  const inches = inchesMatch && parseInt(inchesMatch[1], 10);
  const densityMatch = resolutionString.match(/~?([\d+])\sppi pixel density/);
  const density = densityMatch && parseInt(densityMatch[1], 10);
  return {
    raw: resolutionString,
    pixels,
    inches,
    density
  };
};
const convertMemory = memoryString => {
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
};
// const convertCamera = cameraString => {
//   return cameraString;
// };
// const convertCpu = cpuString => {
//   return cpuString;
// };
const convertStatus = statusString => {
  // Available. Released 2013, November
  let available = false;
  let released = null;
  const match = statusString.match(/^Available\. Released (\d+),\s*(\w+)$/);
  if (match) {
    available = true;
    const [year, month] = match.slice(1);
    released = new Date(`${month} ${year}`);
  }
  return { available, released };
};

const convertRow = async row => {
  const cells = Array.from(row.querySelectorAll("td"));
  const [nameCell, valueCell] = cells;

  let name = jsdomInnerText(nameCell);
  name = name.toLowerCase().replace(/\s+/g, "_");

  let value = jsdomInnerText(valueCell);
  if (name === "size") {
    value = convertSize(value);
  } else if (name === "resolution") {
    value = convertResolution(value);
  } else if (name === "memory") {
    value = convertMemory(value);
  } else if (name === "status") {
    value = convertStatus(value);
  }
  return [name, value];
};

const convertDetailsHtml = async markup => {
  const options = {};
  const dom = new JSDOM(
    `<html><body><table>${markup}</table></body></html>`,
    options
  );
  const table = dom.window.document.querySelector("body>table");
  dom.window.close();

  const details = {};
  const rows = Array.from(table.querySelectorAll("tr"));
  await Promise.all(
    rows.map(async row => {
      const [name, value] = await convertRow(row);
      details[name] = value;
    })
  );
  return details;
};

module.exports = async id => {
  const filename = path.join(detailsCachePath, `${id}.html`);
  if (!fs.existsSync(filename)) {
    throw new Error(`Cannot get details for id ${id}`);
  }

  const list = await fs.readJson(listCachePath);
  /* eslint-disable camelcase */
  const listItem = list.find(({ phone_id }) => phone_id === id);
  /* eslint-enable camelcase */
  if (!listItem) {
    throw new Error(`Cannot get basic info on ${id}`);
  }

  const detailsHtml = await fs.readFile(filename);
  const detailsJson = await convertDetailsHtml(detailsHtml);
  return {
    ...detailsJson,
    ...listItem
  };
};
