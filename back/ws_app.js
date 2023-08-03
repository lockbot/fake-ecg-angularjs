const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8008 });

const {app, handlers } = require('./app');

app.listen(3000, () => console.log('Listening on port 3000'));

wss.on('connection', ws => {
  console.log('New client connected');

  ws.on('message', message => {
    cpf = JSON.parse(message).cpf;
    handlers.fetchEcgData(cpf)
      .then(fetched_data => {
        let all_data = fetched_data.ecg_data /*: int[5][20][5]*/;

        let myTimer = setInterval(() => {
          all_data.map(data => {
            // let data = dt.map(function(col) {
            //   return col.slice();
            // });
            new_i = Math.floor(Math.random() * 5)
            last_column = Array.from({length: 5}, () => 0);
            for (let j = 0; j < 5; j++) {
              last_column[j] = (128 !== (data[19][j] & 128)) ? data[19][j] << 1 : 0;
            }
            last_column[new_i] |= 1;

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

          ws.send(JSON.stringify(all_data));
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
              clearInterval(myTimer);
            });
        });

      })
      .catch(error => {
        console.error('Error:', error);
      });
  });
});
