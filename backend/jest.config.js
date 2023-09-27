/* eslint-disable @typescript-eslint/no-var-requires */

const tsconfig = require('./tsconfig.json')

const fromPairs = (pairs) => pairs.reduce((res, [key, value]) => ({ ...res, [key]: value }), {})

/**
 * tsconfig の paths の設定から moduleNameMapper を生成する
 * {"@app/*": ["src/*"]} -> {"@app/(.*)": "<rootDir>/src/$1"}
 */
function moduleNameMapperFromTSPaths(tsconfig) {
  return fromPairs(
    Object.entries(tsconfig.compilerOptions.paths).map(([k, [v]]) => [
      k.replace(/\*/, '(.*)'),
      `<rootDir>/${tsconfig.compilerOptions.baseUrl}/${v.replace(/\*/, '$1')}`,
    ]),
  )
}

/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        babelConfig: true,
        isolatedModules: true,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/dist'],
  testTimeout: 90000,
  testRegex: ['__tests__/.*tests?.ts$'],
  bail: false,
  roots: ['<rootDir>'],
  moduleNameMapper: moduleNameMapperFromTSPaths(tsconfig),
  transformIgnorePatterns: ['node_modules/(?!(axios|@crowd/))/'],
}
