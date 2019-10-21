const path = require("path");

const cacheDir = path.resolve(__dirname, "../..", ".gsm-search-cache");

module.exports = {
  cacheDir,
  listCachePath: path.join(cacheDir, "list.json"),
  detailsCachePath: path.join(cacheDir, "details"),
  detailsConvertedCachePath: path.join(cacheDir, "details-converted")
};
