const { gql } = require("apollo-server");

const typeDefs = gql`
  scalar Date

  type Query {
    phones(
      name: String
      available: Boolean
      minReleased: Date
      maxReleased: Date
      minSizeWidth: Int
      maxSizeWidth: Int
      minSizeHeight: Int
      maxSizeHeight: Int
      minSizeDepth: Int
      maxSizeDepth: Int
      minMemoryKb: Int
      maxMemoryKb: Int
      minMemoryMb: Int
      maxMemoryMb: Int
      minMemoryGb: Int
      maxMemoryGb: Int
      cpu: String
      page: Int
    ): QueryPhonesResult
  }

  type QueryPhonesResult {
    count: Int!
    results: [Phone]!
  }

  type Phone {
    id: ID!
    name: String!
    thumb: String!
    makerName: String!
    status: PhoneStatus!
    size: PhoneSize!
    display: String!
    resolution: PhoneResolution!
    cardSlot: String!
    memory: PhoneMemory!
    camera: String!
    video: String!
    os: String!
    cpu: String!
  }

  type PhoneMemory {
    raw: String!
    kb: Int!
    mb: Float!
    gb: Float!
  }

  type PhoneResolution {
    raw: String!
    pixels: PhoneResolutionPixels!
  }

  type PhoneResolutionPixels {
    width: Int!
    height: Int!
    inches: Int!
    density: Int!
  }

  type PhoneSize {
    raw: String!
    height: Int!
    width: Int!
    depth: Int!
    weight: Int!
  }

  type PhoneStatus {
    available: Boolean!
    released: Date
  }
`;

module.exports = typeDefs;
