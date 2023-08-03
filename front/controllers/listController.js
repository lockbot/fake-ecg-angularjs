angular.module('frontApp').controller('ListController', ['$scope', 'RegService', 'SharedDataService', '$location', function($scope, RegService, SharedDataService, $location) {
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
}]);
