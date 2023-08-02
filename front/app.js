angular.module('frontApp', ['ngRoute', 'ngMaterial'])
  .config(['$routeProvider', '$mdThemingProvider', function($routeProvider, $mdThemingProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/listView.html',
        controller: 'ListController'
      })
      .when('/new', {
        templateUrl: 'views/formView.html',
        controller: 'FormController'
      })
      .otherwise({
        redirectTo: '/'
      });
      // Configuring the theme
      $mdThemingProvider.theme('default')
        .primaryPalette('red');
  }])
  .run(['$rootScope', '$location', function($rootScope, $location) {
    $rootScope.navigate = function(url) {
      $location.path(url);
    }
  }]);
