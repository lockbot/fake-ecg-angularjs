angular.module('frontApp').controller('ExamsController', ['$scope', 'RegService', 'SharedDataService', function($scope, RegService, SharedDataService) {
  $scope.regis = SharedDataService.get();

  $scope.ecg_data = Array.from({length: 5}, () => Array.from({length: 8}, () => Array.from({length: 20}, () => 0)));

  $scope.ecg_data_ecg = Array.from({length: 5}, () => Array.from({length: 200}, () => 0));

  let charts = new Array(5);
  let charts_ecg = new Array(5);

  const ws = new WebSocket('ws://localhost:8008');

  // I think there's something here like lifecycle hooks to solve it
  const svg = d3.select('svg');
  svg
    .append('circle')
    .attr('cx', '50%')
    .attr('cy', '50%')
    .attr('r', 40)
    .attr('fill', 'orange')
    .transition()
    .duration(1000)
    .attr('r', 5);

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

    $scope.ecg_data_ecg.forEach((graph, i) => {
      let canvas_ecg = document.getElementById('ecgGraphEcg' + i);
      if (canvas_ecg) {
        let ctx_ecg = canvas_ecg.getContext('2d');
        ctx_ecg.clearRect(0, 0, canvas_ecg.width, canvas_ecg.height);

        charts_ecg[i] = new Chart(ctx_ecg, {
          type: 'line',
          data: {
            labels: Array.from({length: $scope.ecg_data_ecg[i].length}, (_, j) => j),
            datasets: [{
              data: $scope.ecg_data_ecg[i],
              fill: false,
              label: 'Main',
              borderColor: `rgba(0,255,0,1)`,
              borderWidth: 1,
              pointRadius: 0,
            }],
          },
          options: {
            scales: {
              y: {
                ticks: {
                  display: false,
                  beginAtZero: true,
                },
              },
              x: {
                ticks: {
                  display: false,
                  beginAtZero: true,
                },
              },
            },
            plugins: {
              legend: {
                display: false
              }
            }
          }
        });
      }
    });
  };

  let _100secCount = 0;
  ws.onmessage = function(event) {
    let data = JSON.parse(event.data);
    // type is an object property here
    // 1sec tell it has _1sec data
    // 100ms tell it has _100ms data
    switch (data.type) {
      case '1sec':
        let _1secData = data._1sec;
        $scope.$apply(function() {
          if (_1secData) {
            _1secData.forEach((graph, i) => {
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
        break;
      case '100ms':
        let _100msData = data._100ms;
        $scope.$apply(function() {
          if (_100msData) {
            _100msData.forEach((graph_value, i) => {
              $scope.ecg_data_ecg[i][_100secCount] = graph_value;
              if (_100secCount < 175) {
                for (let j = 0; j < 16; j++) {
                  $scope.ecg_data_ecg[i][_100secCount + 1 + j] = 0;
                }
              } else {
                for (let j = 0; j < _100secCount - 184; j++) {
                  $scope.ecg_data_ecg[i][j] = 0;
                }
                for (let j = _100secCount; j < 199; j++) {
                  $scope.ecg_data_ecg[i][j+1] = 0;
                }
              }

              if (charts_ecg[i]) {
                charts_ecg[i].update();
              }

            });
            _100secCount++;
            if (_100secCount === 200) {
              _100secCount = 0;
            }
          }
        });
        break;
      default:
        console.log('Unknown message type: ' + data.type);
        console.log(data);
    }

  };

  $scope.leaveExam = function() {
    ws.close();
  };

  $scope.$on('$routeChangeStart', function(next, current) {
    ws.close();

  });
}]);
