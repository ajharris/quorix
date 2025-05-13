module.exports = {
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    resources: "usable",
    runScripts: "dangerously"
  },
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
};
