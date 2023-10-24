const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8008 });

const {app, handlers } = require('./app');
// const { DeviceInstantiate } = require("device/device_utils");

app.listen(3000, () => console.log('Listening on port 3000'));

// await DeviceInstantiate.instantiate(. . .)

wss.on('connection', ws => {
  console.log('New client connected');

  ws.on('message', message => {
    let cpf = JSON.parse(message).cpf;
    handlers.fetchEcgData(cpf)
      .then(fetched_data => {
        let all_data = fetched_data.ecg_data /*: int[5][20][5]*/;


        let my_1secTimer = setInterval(() => {
          let _100msGraphValue = Array.from({length: 5}, () => 0);
          all_data.map((data, graph_idx) => {
            let new_j = Math.floor(Math.random() * 5)

            // Here starts the block of _100ms
            let _100msPast_j;
            for (let j = 0; j < 5; j++) {
              if ((j & 1) === 1) {
                _100msPast_j = j;
                break;
              }
            }
            let _100msCounter = 0;
            let my_100msTimer = setInterval(() => {
              let pastWeight = 10 - _100msCounter;
              let futureWeight = _100msCounter;
              let fluctuationWeight = 5 - Math.abs(5 - _100msCounter);

              _100msGraphValue[graph_idx] = (Math.abs((_100msPast_j * pastWeight) - (new_j * futureWeight)) / 10 + (fluctuationWeight * Math.random()) / 2);

              if (graph_idx === 4) {
                console.log('100ms:', _100msGraphValue)
                ws.send(JSON.stringify({type: '100ms', _100ms: _100msGraphValue}));
              }

              _100msCounter++;
              if (_100msCounter === 10) {
                clearInterval(my_100msTimer);
                clearTimeout(my_100msTimer);
              }
            }, 100);
            // End of the _100ms block

            let last_column = Array.from({length: 5}, () => 0);
            for (let j = 0; j < 5; j++) {
              last_column[j] = (128 !== (data[19][j] & 128)) ? data[19][j] << 1 : 0;
            }
            last_column[new_j] |= 1;

            for (let i = 19; i > 0; i--) {
              data[i] = data[i].map((_, index) => data[i - 1][index]);
            }

            data[0] = last_column;

            data[0] = data[0].map((value, index) => value | last_column[index]);

            for (let j = 4; j >= 0; j--) {
              for (let i = 0; i < 20; i++) {
                process.stdout.write(data[i][j].toString() + ' ');
              }
              console.log()
            }
            console.log()

            // finally running step by step
            return data.slice();
          });
          console.log('__________________________')
          // console.log(JSON.stringify(all_data));

          ws.send(JSON.stringify({type: '1sec', _1sec: all_data}));
        }, 1000);

        ws.on('close', () => {
          console.log('Client has disconnected');
          handlers.updateEcgData(cpf, all_data)
            .then(data => {
              console.log('Saving ecg:', data);
            })
            .catch(error => {
              console.error('Error:', error);
            })
            .finally(() => {
              console.log('Closing connection');
              ws.close();
              clearInterval(my_1secTimer);
              clearTimeout(my_1secTimer);
            });
        });

      })
      .catch(error => {
        console.error('Error:', error);
      });
  });
});
