require('source-map-support').install({ environment: 'node' });
import "babel-polyfill";
import fetch from 'isomorphic-fetch';
import fs from 'fs-extra';
import path from "path";
import { listCachePath } from "./cachePaths";


const getPhonesUrl = () => {
  const d = new Date();
  const cacheStr = `${d.getMonth()}${Math.round((d.getDate() * 24 + d.getHours()) / 6)}`;
  return `https://www.gsmarena.com/quicksearch-${cacheStr}.jpg`;
};

export default async () => {
  const url = getPhonesUrl();
  const [makers, phones] = await fetch(url).then((r) => r.json());
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
  await fs.writeJson(listCachePath, list);
}
