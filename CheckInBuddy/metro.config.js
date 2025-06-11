// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// idb shim: keep your custom resolver tweak
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'idb') {
    return {
      filePath: require.resolve('./idb-shim.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Optional: disable the experimental exports resolver if you still need to
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
