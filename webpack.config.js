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
  include: path.resolve(__dirname, "browser"),
  loader: babelLoader
};

const mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

module.exports = {
  mode,
  entry: {
    index: path.resolve(__dirname, "browser/index.js")
  },
  devtool: "inline-source-map",
  output: {
    path: path.resolve(__dirname, "browser-dist"),
    filename: "[name].js"
  },
  module: {
    rules: [babelRule]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "GSM Search",
      template: path.resolve(__dirname, "browser/index.ejs")
    })
  ]
};
