module.exports = function (config) {
  config.set({
    files: ['test/**/*.js',
            { pattern: 'src/**/*.js', included: true, mutated: true },
            { pattern: 'lib/**/*.js', included: true, mutated: false }],
    testFramework: 'mocha',
    testRunner: 'mocha',
    reporter: ['progress', 'clear-text', 'dots', 'html', 'event-recorder'],
    coverageAnalysis: 'all',
    plugins: ['stryker-mocha-runner', 'stryker-html-reporter']
  })
}
