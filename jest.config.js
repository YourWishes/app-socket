module.exports = {
  "roots": [
    "<rootDir>/private"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json"
  ],
  "globals": {
    "ts-jest": {
      tsConfig: './private/tsconfig.json'
    }
  }
}
