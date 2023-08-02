angular.module('frontApp').controller('FormController', ['$scope', 'RegService', '$location', function($scope, RegService, $location) {
  $scope.reg = {
    name: '',
    birth: '',
    cpf: '',
    phone: ''
  };

  $scope.submitForm = function() {
    RegService.create($scope.reg).then(function(response) {
      $location.path('/');  // Redirect to the list page after successful creation.
    }, function(error) {
      console.error(error);
    });
  };
}]);
