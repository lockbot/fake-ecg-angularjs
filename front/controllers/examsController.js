angular.module('frontApp').controller('ExamsController', ['$scope', 'RegService', 'SharedDataService', '$location', function($scope, RegService, SharedDataService, $location) {
  $scope.regis = SharedDataService.get();

  $scope.ecg_data = Array.from({length: 5}, () => Array.from({length: 8}, () => Array.from({length: 20}, () => 0)));

  let charts = new Array(5);

  const ws = new WebSocket('ws://localhost:8080');

  ws.onopen = function() {
    ws.send(JSON.stringify({cpf: $scope.regis.cpf}));
    $scope.ecg_data.forEach((graph, i) => {


      let canvas = document.getElementById('ecgGraph' + i);
      if (canvas) {
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        charts[i] = new Chart(ctx, {
          type: 'line',
          data: {
            labels: Array.from({length: $scope.ecg_data[i][0].length}, (_, k) => k),
            datasets: $scope.ecg_data[i].map((dataset, j) => ({
              data: dataset,
              fill: false,
              label: j === 0 ? 'Main' : (j + 1).toString() + "x older",
              borderColor: `rgba(255,${255 - j * 32},${255 - j * 32},${1 - j * 0.125})`,
              borderWidth: 1,
              pointRadius: 0,
            })),
          },
          options: {
            scales: {
              y: {
                ticks: {
                  display: false,
                  beginAtZero: true,
                },
                grid: {
                  color: 'rgba(255,255,255,0.1)',
                },
              },
              x: {
                ticks: {
                  display: false,
                  beginAtZero: true,
                },
                grid: {
                  color: 'rgba(255,255,255,0.1)',
                },
              },
            },
            plugins: {
              legend: {
                display: true
              }
            }
          }
        });
      }
    });
  };

  ws.onmessage = function(event) {
    let data = JSON.parse(event.data);
    $scope.$apply(function() {
      if (data) {
        data.forEach((graph, i) => {
          let bitwise_j = 1;
          for(let j = 1; j <= 8; j++) {
            graph.forEach((column, k) => {
              found_bitwise_height = false;
              column.forEach((value, height) => {
                if ((value & bitwise_j) === bitwise_j) {
                  $scope.ecg_data[i][j - 1][k] = height;
                }
              });
            });
            bitwise_j <<= 1;
          }
          if (charts[i]) {
            charts[i].update();
          }
        });
      }
    });
  };

  $scope.leaveExam = function() {
    ws.close();
    $location.path('/');  // Add this line to redirect the user
  };

  $scope.$on('$routeChangeStart', function(next, current) {
    ws.close();

  });
}]);
