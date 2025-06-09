const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block the problematic idb file that's causing SHA-1 errors
config.resolver.blockList = [
  /node_modules\/idb\/build\/index\.cjs$/,
  /node_modules\/idb\/build\/.*\.cjs$/,
];

// Configure resolver to handle web dependencies
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add alias for react-dom to react-native-web when in React Native context
config.resolver.alias = {
  'react-dom': 'react-native-web',
  'react-dom/client': 'react-native-web',
  // Redirect idb to a dummy module or skip it entirely for React Native
  'idb': require.resolve('react-native/Libraries/vendor/core/ErrorUtils'),
};

// Configure transformer options
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Handle .mjs files properly
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json', 'mjs'];

module.exports = config;