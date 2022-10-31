/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/dist'],
  testTimeout: 90000,
  testRegex: ['__tests__/.*tests?.ts$'],
  bail: false,
  roots: ['./'],
}
