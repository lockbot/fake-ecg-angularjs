module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      'node_modules/angular/angular.js',
      'app.js',
      'test/**/*.js',
    ],
    browsers: ['Chrome'],
    singleRun: true
  });
};
