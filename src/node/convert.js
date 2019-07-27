import parseArgs from "minimist";
import convertDetailsHtml from "./lib/convertDetailsHtml";

require("source-map-support").install({ environment: "node" });

const argv = parseArgs(process.argv.slice(2), {
  alias: {
    h: "help"
  },
  boolean: ["help"]
});

const usage = `
convert [-h] <id>
 -h - help

Convert a phone id from html to JSON. Useful for debugging.
`;

if (argv.help) {
  console.log(usage);
  process.exit();
}
const [id] = argv._;

const go = async () => {
  if (!id) {
    throw new Error("id is required");
  }
  const details = await convertDetailsHtml(id);
  console.log(JSON.stringify(details, null, 2));
  process.exit();
};
go().catch(e => {
  console.error(e);
  process.exit(1);
});
