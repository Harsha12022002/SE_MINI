export default {
  testEnvironment: "jsdom",
  transform: {
  "^.+\\.[tj]sx?$": "babel-jest",
},

  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"],
  extensionsToTreatAsEsm: [".jsx"], // ✅ only JSX
  moduleFileExtensions: ["js", "jsx"],
  testMatch: ["**/tests/**/*.test.[jt]sx"],
};
