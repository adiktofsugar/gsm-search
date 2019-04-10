require('source-map-support').install({ environment: 'node' });
import "babel-polyfill";
import fs from 'fs-extra';
import path from 'path';
import { detailsConvertedCachePath } from "./cachePaths";
import convertDetailsHtml from "./convertDetailsHtml";

export default async (id, item) => {
  const filename = path.join(detailsConvertedCachePath, id + '.json');
  const details = await convertDetailsHtml(id, item);
  await fs.outputJson(filename, details);
}
