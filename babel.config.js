module.exports = {
  babelrcRoots: [".", "./browser"],
  presets: [
    "@babel/react",
    [
      "@babel/env",
      {
        useBuiltIns: "usage",
        corejs: 3
      }
    ]
  ]
};
