require('source-map-support').install({ environment: 'node' });
import path from "path";

export const cacheDir = path.resolve(__dirname, '..', '.gsm-search-cache');
export const listCachePath = path.join(cacheDir, 'list.json');
export const detailsCachePath = path.join(cacheDir, 'details');
export const detailsConvertedCachePath = path.join(cacheDir, 'details-converted');
