import parseArgs from 'minimist';
import {MongoClient} from 'mongodb';

const dbName = 'gsmSearch';

var argv = parseArgs(process.argv.slice(2), {
  alias: {
    h: 'help'
  },
  boolean: ['help']
});

const usage = `
search [-h]
 -h - help
`

if (argv.help) {
  console.log(usage);
  process.exit();
}

const url = `mongodb://localhost:27017/${dbName}`;
const search = async (queries) => {
  let db, collection;
  try {
    db = await new Promise((resolve, reject) => {
      MongoClient.connect(url, (error, db) => {
        if (error) return reject(error);
        resolve(db);
      });
    });
    collection = await new Promise((resolve, reject) => {
      db.collection('phones', (error, collection) => {
        if (error) return reject(error);
        resolve(collection);
      });
    });
  } catch (e) {
    throw e
  }
  
  console.log('ready');

  try {
    await db.close();
  } catch (e) {
    throw e
  }
}
search(argv._).catch(e => {
  console.error(e);
  process.exit(1);
});
