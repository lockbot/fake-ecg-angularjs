const { DeviceInstantiate } = require('./device_utils');
const { extractCorruptedJSON } = require('./utils');

if (require.main === module) {
  main()
}

function main() {
  DeviceInstantiate.instantiate({
    vendorId: 0x303a,
    productId: 0x1001,
    serialNumber: '00-B0-D0-63-C2-26',
  }).then((response) => {
    // console.log(device);
    const index = response.index;

    // DeviceInstantiate.on(index, 'close', () => {
    //   //TODO: Not reaching this point.
    //   //TODO: Not only that, but it is corrupting the terminal
    //   //TODO: and the callback below `on('data')` is reading the same line twice.
    //   console.log('Device closed');
    // });

    DeviceInstantiate.on(index, 'data', (data) => {
      try {
        const verifyStatusObject = extractCorruptedJSON(data);
        if (verifyStatusObject != null) {
          console.log('Data:', verifyStatusObject);
        }
      } catch (err) {
        console.error(err);
      }
    });

    const jsonMessageStart = {
      command: 'startPseudoExam',
      parameters: {
        examId: 0,
      },
    }
     const jsonMessageStop = {
       command: 'stopPseudoExam',
     }

    // Test listening for 5 seconds
    DeviceInstantiate.write(index,JSON.stringify(jsonMessageStart) + '\n');
    setTimeout(() => {
      DeviceInstantiate.write(index,JSON.stringify(jsonMessageStop) + '\n');
      setTimeout(() => {
        DeviceInstantiate.close(index);
      }, 500);
    }, 5000);

  }).catch(err => console.error(err));
}