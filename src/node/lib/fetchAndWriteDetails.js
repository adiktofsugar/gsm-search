import fetch from "isomorphic-fetch";
import fs from "fs-extra";
import path from "path";
import { detailsCachePath, detailsConvertedCachePath } from "./cachePaths";

const delay = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const DETAILS_URL = "https://www.gsmarena.com/phone-widget.php3?idPhone=";

const GET_DETAIL_HTML_MAX_ERRORS = 5;
const GET_DETAIL_HTML_DELAY_MS = 2000;
const getDetailsHtml = async (id, errorCount = 0) => {
  try {
    const response = await fetch(`${DETAILS_URL}${id}`);
    if (!response.ok) {
      throw new Error(`Bad response status: ${response.status}`);
    }
    return response.text();
  } catch (e) {
    if (errorCount > GET_DETAIL_HTML_MAX_ERRORS) {
      throw e;
    }
    let delayMs = GET_DETAIL_HTML_DELAY_MS;
    if (["ETIMEDOUT", "ECONNRESET"].includes(e.code)) {
      delayMs = GET_DETAIL_HTML_DELAY_MS * 10;
    }
    await delay(delayMs);
    return getDetailsHtml(id, errorCount + 1);
  }
};

export default async id => {
  const filename = path.join(detailsCachePath, `${id}.html`);
  const detailsHtml = await getDetailsHtml(id);
  // Delete derived converted data if the source changes
  const convertedFilename = path.join(detailsConvertedCachePath, `${id}.json`);
  if (fs.existsSync(convertedFilename)) {
    await fs.remove(convertedFilename);
  }
  await fs.outputFile(filename, detailsHtml);
};
