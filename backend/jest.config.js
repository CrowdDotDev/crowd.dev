/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        babelConfig: true,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/dist'],
  testTimeout: 90000,
  testRegex: ['__tests__/.*tests?.ts$'],
  bail: false,
  roots: ['./'],
  transformIgnorePatterns: ['node_modules/(?!(axios|@crowd/))/'],
}
