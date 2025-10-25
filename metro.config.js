const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Custom resolver to prevent Metro from looking at local firebase/functions
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // If trying to resolve firebase/functions, force it to use node_modules
  if (moduleName === "firebase/functions") {
    const nodeModulesPath = path.join(
      __dirname,
      "node_modules",
      "firebase",
      "functions"
    );
    return context.resolveRequest(context, nodeModulesPath, platform);
  }

  // Use default resolver for everything else
  if (defaultResolver) {
    return defaultResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
