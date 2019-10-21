const parseArgs = require("minimist");
const fs = require("fs-extra");
const path = require("path");
const ProgressBar = require("ascii-progress");
const mongo = require("./lib/mongo");
const {
  listCachePath,
  detailsCachePath,
  detailsConvertedCachePath
} = require("./lib/cachePaths");
const fetchAndWriteList = require("./lib/fetchAndWriteList");
const fetchAndWriteDetails = require("./lib/fetchAndWriteDetails");
const convertAndWriteDetails = require("./lib/convertAndWriteDetails");

require("source-map-support").install({ environment: "node" });

const argv = parseArgs(process.argv.slice(2), {
  alias: {
    h: "help",
    l: "list",
    f: "force",
    F: "forceAll"
  },
  boolean: ["help", "list", "forceAll"]
});

const usage = `
build [-h][-f <l|d|c>][-F]
 -h - help
 -f [type] - clear type cache
  type can be:
    l list of phones. If you think a new phone has been added, use this.
    d details. Details of each phone in raw form. This is the html
        and basically never changes. The converted form is generated from this,
        so if you delete this cache, it deletes the converted as well.
    c details-converted. This is the JSON version of the details. If you change the
        code for how the HTML is converted to JSON, clear this.
 -F - clear all caches

`;

if (argv.help) {
  console.log(usage);
  process.exit();
}

let pathsToRemove = [];
if (argv.force) {
  if (argv.force === "l") {
    pathsToRemove = [listCachePath];
  } else if (argv.force === "d") {
    pathsToRemove = [detailsCachePath, detailsConvertedCachePath];
  } else if (argv.force === "c") {
    pathsToRemove = [detailsConvertedCachePath];
  } else {
    console.error(`${argv.force} is not a valid argument to -f`);
    process.exit(1);
  }
}
if (argv.forceAll) {
  pathsToRemove = [listCachePath, detailsCachePath, detailsConvertedCachePath];
}

const go = async () => {
  await Promise.all(
    pathsToRemove.map(async cachePath => {
      console.log(`removing ${cachePath}`);
      await fs.remove(cachePath);
    })
  );
  if (!fs.existsSync(listCachePath)) {
    await fetchAndWriteList();
    console.log("Fetched and wrote list");
  }
  const list = await fs.readJson(listCachePath);
  const phoneIds = list.map(details => parseInt(details.phone_id, 10));

  const loadingDetailsBar = new ProgressBar({
    schema: "fetched :current/:total :bar",
    total: phoneIds.length
  });
  const convertingDetailsBar = new ProgressBar({
    schema: "converted :current/:total :bar",
    total: phoneIds.length
  });
  const injectingDetailsBar = new ProgressBar({
    schema: "injected :current/:total :bar",
    total: phoneIds.length
  });

  for (const item of list) {
    const id = item.phone_id;
    const filename = path.join(detailsCachePath, `${id}.html`);
    if (!fs.existsSync(filename)) await fetchAndWriteDetails(id);
    loadingDetailsBar.tick();
  }
  console.log("Fetched and wrote missing detail html files");

  for (const item of list) {
    const id = item.phone_id;
    const filename = path.join(detailsConvertedCachePath, `${id}.html`);
    if (!fs.existsSync(filename)) await convertAndWriteDetails(id, item);
    convertingDetailsBar.tick();
  }

  console.log("Converted details html files and wrote as json");

  const collection = await mongo.getCollection();
  await collection.deleteMany({ phone_id: { $in: phoneIds } });

  for (const item of list) {
    const id = item.phone_id;
    const filename = path.join(detailsConvertedCachePath, `${id}.json`);
    if (!fs.existsSync(filename)) {
      throw new Error(
        `Converted JSON details file for id ${id} does not exist`
      );
    }
    const details = await fs.readJson(filename);
    await collection.insertOne(details);
    injectingDetailsBar.tick();
  }

  await mongo.close();
  console.log("Wrote converted details JSON files to db");
  process.exit();
};

go().catch(e => {
  console.error(e);
  process.exit(1);
});
