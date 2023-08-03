angular.module('frontApp').controller('FormController', ['$scope', 'RegService', '$location', function($scope, RegService, $location) {
  $scope.regis = {
    name: '',
    birth: new Date,
    cpf: '',
    phone: ''
  };

  $scope.submitForm = function() {
    RegService.create($scope.regis)
      .then(function(response) {
        $location.path('/');
      }, function(error) {
        console.error(error);
      });
  };
}]);
