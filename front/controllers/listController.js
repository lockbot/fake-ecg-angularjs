angular.module('frontApp')
  .controller('ListController', ['$scope', 'RegService', 'SharedDataService', '$location', function($scope, RegService, SharedDataService, $location) {
  $scope.regises = [];

  RegService.getAll().then(function(response) {
    $scope.regises = response.data;
  }, function(error) {
    console.error(error);
  });

  $scope.search = '';  // This will hold the search input.

  $scope.goToExams = function(regis) {
    SharedDataService.set(regis);
    $location.path('/exams/' + regis.cpf);
  };
}])
  .filter('cpfFilter', function() {
    return function(input) {
      if (!input) { return ''; }
      var str = input + '';
      str = str.replace(/\D/g, '');
      if(str.length === 11) {
        return str.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      }
    };
  })
  .filter('phoneFilter', function() {
    return function(input) {
      if (!input) { return ''; }
      var str = input + '';
      str = str.replace(/\D/g, '');
      if(str.length === 11) {
        return str.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
      }
      if(str.length === 10) {
        return str.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
      }
    };
  });;
