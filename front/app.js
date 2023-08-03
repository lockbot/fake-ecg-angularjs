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
    $rootScope.selectedIndex = 0;
    $rootScope.navigate = function(url) {
      $location.path(url);
    }
    $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
      let path = $location.path();
      // Here we manually match the current path with each tab's route
      if (path  ===  '/') {  // Or any other condition matching your routes
        $rootScope.selectedIndex = 0;
      } else if (path  === '/new') {
        $rootScope.selectedIndex = 1;
      } else if (path.startsWith('/exams')) {
        $rootScope.selectedIndex = 2;
      }
    });
  }]);
