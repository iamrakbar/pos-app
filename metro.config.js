const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const path = require("node:path");

const config = getDefaultConfig(__dirname);
const heroUINativeProEntry = path.resolve(
  __dirname,
  "vendor/heroui-native-pro/lib/module/index.js"
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "heroui-native-pro") {
    return {
      type: "sourceFile",
      filePath: heroUINativeProEntry,
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./src/global.css",
});
