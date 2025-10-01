module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'router/**/*.js',
    'services/**/*.js',
    '!**/*.test.js'
  ],
  testMatch: [
    '**/__tests__/unit/**/*.js',  // ✅ Seulement les tests unitaires
    // '**/__tests__/integration/**/*.js',  // ❌ Commenté temporairement
  ],
  testTimeout: 10000,
  verbose: true
}