const fetch = require("isomorphic-fetch");
const fs = require("fs-extra");
const { listCachePath } = require("./cachePaths");

const getPhonesUrl = () => {
  const d = new Date();
  const cacheStr = `${d.getMonth()}${Math.round(
    (d.getDate() * 24 + d.getHours()) / 6
  )}`;
  return `https://www.gsmarena.com/quicksearch-${cacheStr}.jpg`;
};

module.exports = async () => {
  const url = getPhonesUrl();
  const [makers, phones] = await fetch(url).then(r => r.json());
  /* eslint-disable camelcase */
  const list = phones.map(
    ([maker_id, phone_id, phone_name, search_str, thumb]) => {
      return {
        maker_id,
        maker_name: makers[maker_id],
        phone_id,
        phone_name,
        search_str,
        thumb
      };
    }
  );
  /* eslint-enable camelcase */
  await fs.writeJson(listCachePath, list);
};
