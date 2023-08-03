angular.module('frontApp', ['ngRoute', 'ngMaterial'])
  .config(['$routeProvider', '$mdThemingProvider', '$mdDateLocaleProvider', function($routeProvider, $mdThemingProvider, $mdDateLocaleProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/listView.html',
        controller: 'ListController'
      })
      .when('/new', {
        templateUrl: 'views/formView.html',
        controller: 'FormController'
      })
      .when('/exams/:cpf', {
        templateUrl: 'views/examsView.html',
        controller: 'ExamsController'
      })
      .otherwise({
        redirectTo: '/'
      });
      // Configuring the theme
      $mdThemingProvider.theme('default')
        .primaryPalette('red');
      $mdDateLocaleProvider.formatDate = function(date) {
        try {
          var day = date.getDate();
          var monthIndex = date.getMonth();
          var year = date.getFullYear();

          return day + '/' + (monthIndex + 1) + '/' + year;
        } catch (error) {
          throw new Error('Provided value is not a Date object.');
        }
      };
  }])
  .service('SharedDataService', function() {
    var sharedData = {};

    return {
      get: function() {
        return sharedData;
      },
      set: function(value) {
        sharedData = value;
      }
    }
  })
  .run(['$rootScope', '$location', function($rootScope, $location) {
    $rootScope.navigate = function(url) {
      $location.path(url);
    }
  }]);
