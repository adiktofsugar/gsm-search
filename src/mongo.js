import {MongoClient} from 'mongodb';

export const dbName = 'gsmSearch';
export const dbUrl = `mongodb://localhost:27017/${dbName}`;

export const getDbAndCollection = async () => {
  const db = await new Promise((resolve, reject) => {
    MongoClient.connect(dbUrl, (error, db) => {
      if (error) return reject(error);
      resolve(db);
    });
  });
  const collection = await new Promise((resolve, reject) => {
    db.collection('phones', (error, collection) => {
      if (error) return reject(error);
      resolve(collection);
    });
  });
  return [db, collection];
}
