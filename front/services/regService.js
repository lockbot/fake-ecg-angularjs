angular.module('frontApp').service('RegService', ['$http', function($http) {
  this.getAll = function() {
    return $http.get('http://localhost:3000/');
  };

  this.getByCpf = function(cpf) {
    return $http.get('http://localhost:3000/' + cpf);
  };

  this.create = function(regis) {
    return $http.post('http://localhost:3000/', regis);
  };
}]);
