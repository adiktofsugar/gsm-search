import { MongoClient } from "mongodb";

export const dbName = "gsmSearch";
export const dbUrl = `mongodb://localhost:27017/${dbName}`;

const getDb = async () =>
  new Promise((resolve, reject) => {
    MongoClient.connect(dbUrl, (error, db) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(db);
    });
  });
const getCollection = async db =>
  new Promise((resolve, reject) => {
    db.collection("phones", (error, collection) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(collection);
    });
  });

export const getDbAndCollection = async () => {
  const db = await getDb();
  const collection = await getCollection(db);
  return [db, collection];
};
