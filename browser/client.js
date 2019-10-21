import ApolloClient from "apollo-boost";

const client = new ApolloClient({
  uri: "http://localhost:8081"
});

export default client;
