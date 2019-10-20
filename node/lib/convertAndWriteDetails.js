const fs = require("fs-extra");
const path = require("path");
const { detailsConvertedCachePath } = require("./cachePaths");
const convertDetailsHtml = require("./convertDetailsHtml");

module.exports = async (id, item) => {
  const filename = path.join(detailsConvertedCachePath, `${id}.json`);
  const details = await convertDetailsHtml(id, item);
  await fs.outputJson(filename, details);
};
