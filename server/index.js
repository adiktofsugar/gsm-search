const { ApolloServer } = require("apollo-server");
const { MongoClient } = require("mongodb");
const typeDefs = require("./schema");
const PhonesAPI = require("./datasources/phones");
const resolvers = require("./resolvers");

const dbName = "gsmSearch";
const dbUrl = `mongodb://localhost:27017`;

const client = new MongoClient(dbUrl);

const dataSources = () => ({
  phonesAPI: new PhonesAPI({
    client,
    name: dbName,
    collection: "phones"
  })
});

const server = new ApolloServer({ typeDefs, resolvers, dataSources });
server.listen({ port: 8081 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
