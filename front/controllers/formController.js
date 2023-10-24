angular.module('frontApp')
  .controller('FormController', ['$scope', '$mdDialog', 'RegService', '$location', function($scope, $mdDialog, RegService, $location) {
  $scope.regis = {
    name: '',
    birth: new Date,
    cpf: '',
    phone: ''
  };

  $scope.namePattern = /^[A-Z\u00C0-\u00DD][a-z\u00DE-\u00FF]+((\'[A-Za-z\u00C0-\u00FF]*\s|\s)?(D?d?e?t?\'?a?o?s?\s)?[A-Z\u00C0-\u00DD][a-z\u00DE-\u00FF]+)+$/;

  $scope.currentDate = new Date();
  $scope.minDate = new Date();
  $scope.minDate.setFullYear($scope.minDate.getFullYear() - 160);
  $scope.maxDate = new Date();
  $scope.regis.birth = new Date(1980, 0, 1); // Default date 01/01/1980

  $scope.cpfMask = '999.999.999-99';

  $scope.phoneMask = '(99) 9? 9999-9999';

  $scope.submitForm = function() {
    let name = $scope.regis.name;
    let phone = $scope.regis.phone.replace(/\D/g,''); // Remove non-numeric characters
    let cpf = $scope.regis.cpf.replace(/\D/g,''); // Remove non-numeric characters
    let birth = new Date($scope.regis.birth); // Ensure birth is a date object

    if((phone.length !== 0 && phone.length !== 10 && phone.length !== 11) || cpf.length !== 11) {
      $mdDialog.show(
        $mdDialog.alert()
          .parent(angular.element(document.querySelector('#popupContainer')))
          .clickOutsideToClose(true)
          .title('Alerta!')
          .textContent('Telefone deve ter 10 ou 11 digitos, CPF deve ter 11 digitos.')
          .ariaLabel('Alerta de telefone ou CPF inválido')
          .ok('Fechar')
      );
    } else {
      // All checks passed, create new registration
      RegService.create({name: name, phone: phone, cpf: cpf, birth: birth})
        .then(function(response) {
          $location.path('/');
        }, function(error) {
          // Handle backend error
          $mdDialog.show(
            $mdDialog.alert()
              .parent(angular.element(document.querySelector('#popupContainer')))
              .clickOutsideToClose(true)
              .title('Erro!')
              .textContent('Erro de cadastro. Verifique se os campos estão preenchidos corretamente. Possíveis causas: CPF já cadastrado ou inválido; Nome muito longo (abrevie com três primeiras letras de cada sobrenome); Outras causas...')
              .ariaLabel('Alerta de erro de cadastro')
              .ok('Fechar')
          );
          console.error(error);
        });
    }
  };

}]);
