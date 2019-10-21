const { MongoClient } = require("mongodb");

const dbName = "gsmSearch";
const dbUrl = `mongodb://localhost:27017`;

let currentClient;
const getClient = async () => {
  if (!currentClient) {
    currentClient = new MongoClient(dbUrl);
    await currentClient.connect();
  }
  return currentClient;
};

const getDb = async () => {
  const client = await getClient();
  return client.db(dbName);
};

const close = async () => {
  const client = await getClient();
  await client.close();
  currentClient = undefined;
};

const getCollection = async () => {
  const db = await getDb();
  return db.collection("phones");
};

module.exports = {
  getClient,
  getDb,
  getCollection,
  close
};
