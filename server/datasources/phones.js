const { DataSource } = require("apollo-datasource");

const phoneReducer = phone => {
  const {
    status,
    size,
    display,
    resolution,
    card_slot: cardSlot,
    memory,
    camera,
    video,
    os,
    cpu,
    maker_name: makerName,
    phone_id: id,
    phone_name: name,
    thumb
  } = phone;
  return {
    status,
    size,
    display,
    resolution,
    cardSlot,
    memory,
    camera,
    video,
    os,
    cpu,
    makerName,
    id,
    name,
    thumb
  };
};

class PhonesAPI extends DataSource {
  constructor({ client, name, collection }) {
    super();
    this.client = client;
    this.dbName = name;
    this.collectionName = collection;
  }

  async connect() {
    if (!this.client.isConnected()) {
      await this.client.connect();
    }
  }

  async getDb() {
    await this.connect();
    return this.client.db(this.dbName);
  }

  async getCollection() {
    const db = await this.getDb();
    return db.collection(this.collectionName);
  }

  async getPhonesByQuery(query, page = 0) {
    const limit = 10;
    const collection = await this.getCollection();
    const cursor = await collection
      .find(query, { limit, skip: page * limit })
      .project({ _id: 0 });

    const count = await cursor.count();
    const results = await cursor.toArray();
    return { count, results: results.map(phoneReducer) };
  }
}

module.exports = PhonesAPI;
