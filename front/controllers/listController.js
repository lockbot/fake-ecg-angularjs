angular.module('frontApp').controller('ListController', ['$scope', 'RegService', function($scope, RegService) {
  $scope.regs = [];

  RegService.getAll().then(function(response) {
    $scope.regs = response.data;
  }, function(error) {
    console.error(error);
  });

  $scope.search = '';  // This will hold the search input.
}]);
