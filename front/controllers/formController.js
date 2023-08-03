angular.module('frontApp').controller('FormController', ['$scope', 'RegService', function($scope, RegService) {
  $scope.regis = {
    name: '',
    birth: new Date,
    cpf: '',
    phone: ''
  };

  $scope.submitForm = function() {
    RegService.create($scope.regis).then(function(response) {
    }, function(error) {
      console.error(error);
    });
  };
}]);
