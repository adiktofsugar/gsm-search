const nodeExternals = require("webpack-node-externals");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const babelLoader = {
  loader: "babel-loader",
  options: {
    rootMode: "upward"
  }
};
const babelRule = {
  test: /\.js$/,
  include: path.resolve(__dirname, "src"),
  loader: babelLoader
};

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

const nodeConfig = {
  target: "node",
  externals: nodeExternals(),
  mode,
  entry: {
    build: path.resolve(__dirname, "src/node/build.js"),
    search: path.resolve(__dirname, "src/node/search.js"),
    convert: path.resolve(__dirname, "src/node/convert.js")
  },
  output: {
    path: path.resolve(__dirname, "dist/node"),
    filename: "[name].js"
  },
  module: {
    rules: [babelRule]
  },
  node: false
};
const browserConfig = {
  mode,
  entry: {
    index: path.resolve(__dirname, "src/browser/index.js")
  },
  output: {
    path: path.resolve(__dirname, "dist/browser"),
    filename: "[name].js"
  },
  module: {
    rules: [babelRule]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "GSM Search"
    })
  ]
};
module.exports = [nodeConfig, browserConfig];
