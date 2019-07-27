module.exports = {
  babelrcRoots: [".", "./src/browser", "./src/node"],
  presets: [
    [
      "@babel/env",
      {
        useBuiltIns: "usage",
        corejs: 3
      }
    ]
  ]
};
