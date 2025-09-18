module.exports = {
  extends: [
    './base.js',
    '@react-native-community',
  ],
  plugins: ['react', 'react-hooks', 'react-native'],
  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-native/no-unused-styles': 'error',
    'react-native/split-platform-components': 'error',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
  },
  env: {
    'react-native/react-native': true,
  },
};