/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['./src/config/setup-tests.ts'],
  testPathIgnorePatterns: ['/dist'],
  testTimeout: 90000,
  testRegex: ['__tests__/.*tests?.ts$'],
  bail: true,
  roots: ['./'],
}
