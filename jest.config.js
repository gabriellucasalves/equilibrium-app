/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/test/mocks/async-storage.ts',
    '^react-native$': '<rootDir>/test/mocks/react-native.ts',
    '^expo-network$': '<rootDir>/test/mocks/expo-network.ts',
    '^expo-crypto$': '<rootDir>/test/mocks/expo-crypto.ts',
    '^expo-location$': '<rootDir>/test/mocks/expo-location.ts',
  },
  clearMocks: true,
  globals: {
    __DEV__: true,
  },
};
