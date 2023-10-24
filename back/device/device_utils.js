const { SerialPort } = require('serialport');
const { usb, findByIds } = require("usb");
const { ReadlineParser } = require("@serialport/parser-readline");

const { extractCorruptedJSON } = require('./utils');

/**
 *
 * Device can discover, wait until its connected and connect to a device.
 * Then its properties port and parser can be used to listen for data from the device.
 * @class Device
 * @property {Object} initial_credentials Credentials of the device.
 * @property {number} initial_credentials.vendorId Vendor ID of the device.
 * @property {number} initial_credentials.productId Product ID of the device.
 * @property {string} initial_credentials.serialNumber Serial number of the device.
 * @property {SerialPort} port SerialPort object.
 * @property {ReadlineParser} parser ReadlineParser object.
 * @method init() It loops until the device with correct SerialNumber is found.
 * It generates the SerialPort and ReadlineParser objects and check for SerialNumber.
 * @method connect() It loops until the device is found.
 * It generates the SerialPort and ReadlineParser objects only, without checking SerialNumber.
 * @method listen() It listens for data from the device.
 * @method mute() It closes the connection with the device.
 *
 */
class Device {
  /**
   *
   * @param {Object} device_credentials Credentials of the device.
   * @param {number} device_credentials.vendorId Vendor ID of the device.
   * @param {number} device_credentials.productId Product ID of the device.
   * @param {string} device_credentials.serialNumber Serial number of the device.
   * @param {boolean} [freeze=true] If true, the initial_credentials will be frozen.
   * @returns {Device} Device object.
   * @returns {Object} Device.initial_credentials
   * @returns {number} Device.initial_credentials.vendorId
   * @returns {number} Device.initial_credentials.productId
   * @returns {boolean} Device.frozen
   * @returns {string} Device.initial_credentials.serialNumber
   * @returns {SerialPort} Device.port
   * @returns {ReadlineParser} Device.parser
   *
   */
  constructor(device_credentials, freeze = true) {
    this.initial_credentials = device_credentials;
    this.port = null;
    this.parser = null;
    this.frozen = freeze;
    if (this.frozen)
      Object.defineProperties(this, {'initial_credentials': {configurable: false, writable: false}});
  }

  /**
   *
   * It loops until the device with correct SerialNumber is found.
   * It generates the SerialPort and ReadlineParser objects and check for SerialNumber.
   * @returns {Promise<void>}
   * @throws {Error} Error if error during connection.
   *
   */
  async init() {
    try {
      [this.port, this.parser] = await this.connect();

      this.port.write("{}\n");

      const jsonMessageVerifyStatusSerialNumber = {
        command: 'verifyStatus',
        parameters: {
          latestFirmware: '1.0.1',
        },
      };
      const found = await this.#checkSerialNumberByJsonRequest(jsonMessageVerifyStatusSerialNumber).catch(err => {
        console.error(err);
        throw Promise.reject(err);
      });
      if (found) {
        console.log(`Found device! Serial number is: ${this.initial_credentials.serialNumber}`);
        this.port.close();
        [this.port, this.parser] = [null, null];
        [this.port, this.parser] = await this.connect().catch(err => {
          console.error(err);
          throw Promise.reject(err);
        });
        // locking port and parser after complete initialization.
        if (this.frozen)
          Object.defineProperties(this, {'port': {configurable: false, writable: false}, 'parser': {configurable: false, writable: false}});
      } else {
        console.log("Serial number not found or doesn't match.");
        this.port.close();
        [this.port, this.parser] = [null, null];
        await this.init().catch(err => {
          console.error(err);
          throw Promise.reject(err);
        });
        console.log('Resolved attempt to reconnect.');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  /**
   *
   * It loops until the device is found.
   * It generates the SerialPort and ReadlineParser objects only, without checking SerialNumber.
   * @returns {Promise<[SerialPort, ReadlineParser]>}
   *
   */
  async connect() {
    let deviceObject;
    console.log('Listening for USB devices...');
    await this.#findDeviceByVendNProdIds()
      .then(result => {
        deviceObject = result;
      })
      .catch(err => {
        console.error(err);
        return Promise.reject(err);
      });

    console.log(deviceObject);
    const [port, err] = await this.#getSerialByPortNumber();
    if (!err) {
      console.log('Serial port found.');
      // console.log(port);
    } else {
      console.error(err);
      return Promise.reject(err);
    }

    // Reads every line until '\n' and then emits a 'data' event with the line.
    const parser = new ReadlineParser({ delimiter: '\n'});

    try {
      return [port, parser];
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  }

  /**
   *
   * If connected, de device will be detected, if not,
   * it will wait for the next device to connect and check if is it the correct one.
   * @returns {Promise<Device>} Device from the usb::findByIds() function.
   * @throws {Error} Error if device not found because of some technical failure of usb::findByIds().
   *
   */
  async #findDeviceByVendNProdIds() {
    const deviceObject = findByIds(this.initial_credentials.vendorId, this.initial_credentials.productId);
    console.log(deviceObject);
    if (deviceObject) {
      try {
        console.log(`Device found with specified idVendor ${deviceObject.deviceDescriptor.idVendor.toString(16)} and idProduct ${deviceObject.deviceDescriptor.idProduct.toString(16)}.`);
        return deviceObject;
      } catch (err) {
        console.log(`Device should be found with specified idVendor ${this.initial_credentials.vendorId.toString(16)} and idProduct ${this.initial_credentials.productId.toString(16)}.`);
        console.error(err);
        return Promise.reject(err);
      }
      // console.log(deviceObject);
    } else {
      console.log('Device not found.');
      return new Promise((resolve, reject) => {
        try {
          usb.on('attach', (device) => {
            console.log('USB device detected.');
            console.log(device);
            if (device.deviceDescriptor.idVendor === this.initial_credentials.vendorId && device.deviceDescriptor.idProduct === this.initial_credentials.productId) {
              console.log('Device found.');
              resolve(this.#findDeviceByVendNProdIds());
            } else {
              console.log('Try again.');
              resolve(this.#findDeviceByVendNProdIds());
            }
          });
        } catch (err) {
          console.error(err);
          reject(err);
        }
      });
    }
  }

  /**
   *
   * @returns {Promise<[SerialPort, Error]>} SerialPort object and error if any.
   * @throws {Error} Error if no port found.
   * @throws {Error} Error if SerialPort.list() fails.
   *
   */
  async #getSerialByPortNumber() {
    return new Promise((resolve, reject) => {
      SerialPort.list()
        .then(ports => {
          if (ports) {
            const port_res = ports.find(port => port.vendorId === this.initial_credentials.vendorId.toString(16) && port.productId === this.initial_credentials.productId.toString(16));
            resolve([new SerialPort({path: port_res.path, baudRate: 115200}) , null]);
          } else {
            reject([null, Error('No port found.')]);
          }
        })
        .catch(err => {
          reject(err);
          resolve([null, err]);
        });
    });
  }

  /**
   *
   * @param {Object} jsonRequest JSON request to be sent to the device.
   * @returns {Promise<boolean>} True if the serial number is correct, false otherwise.
   * @throws {Error} Error if fails to write to the port.
   * @throws {Error} Error if no response from device.
   *
   */
  async #checkSerialNumberByJsonRequest(jsonRequest) {
    const stringRequest = JSON.stringify(jsonRequest) + "\n";
    return new Promise((resolve, reject) => {
      this.port.pipe(this.parser); //TODO: remove this line
      this.parser.on('data', (data) => { //TODO: remove this line
        console.log('Data:', data); //TODO: remove this line
        resolve(true); //TODO: remove this line
      }); //TODO: remove this line
      this.port.write(stringRequest, (err) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log('Check serial number request sent.');
        }
      });
      this.port.pipe(this.parser);
      let count = 0;
      setTimeout(() => {
        // 'count = 51;' launches the attempt count above the limit of 50
        // after 5 seconds and triggers the rejection of the promise.
        count = 51;
        this.port.write("{}\n");
      }, 5000);
      this.parser.on('data', (data) => {
        // console.log('Data:', data);
        let verifyStatusObject;
        try {
          verifyStatusObject = extractCorruptedJSON(data);
          // console.log('StringData:', data);
          // if (verifyStatusObject != null) {
          //   console.log('Data:', verifyStatusObject);
          // }
        } catch (err) {
          console.error(err);
          reject(err);
        }
        if (verifyStatusObject && verifyStatusObject.report === 'verifyStatus') {
          if (verifyStatusObject.values.serialNumber === this.initial_credentials.serialNumber) {
            resolve(true);
          } else {
            resolve(false);
          }
        }

        // Logic for giving up trying to find the device.
        count++;
        if (count > 50) {
          resolve(false);
          reject(Error('No due response from this after 51 attempts or 5 seconds.'));
        }
      });
    });
  }
}

/**
 *
 * @type {Device[]}
 *
 */
let devices = [];

/**
 *
 * @class DeviceInstantiate
 *
 */
class DeviceInstantiate {
  /**
   *
   * @param {Object} device_credentials Credentials of the device.
   * @param {number} device_credentials.vendorId Vendor ID of the device.
   * @param {number} device_credentials.productId Product ID of the device.
   * @param {string} device_credentials.serialNumber Serial number of the device.
   * @param {boolean} [freeze=true] If true, the initial_credentials will be frozen.
   * @returns {Promise<{index: number}>} The index of the device.
   * @throws {Error} Error if error during initialization.
   *
   */
  static async instantiate(device_credentials, freeze = true) {
    const device = new Device(device_credentials, freeze);
    await device.init().catch(err => {
      console.error(err);
      throw Promise.reject(err);
    });
    const index = devices.push(device) - 1;
    devices[index].port.pipe(devices[index].parser);
    return {
      index: index,
    };
  }

  /**
   *wd
   * @param {number} index Index of device.
   * @param {string} event Event to listen.
   * @param {function} callback Callback function.
   * @returns {void}
   * @throws {Error} Error if index is undefined.
   * @throws {Error} Error if device not found.
   * @throws {Error} Error if error during listening.
   *
   */
  static on = (index, event, callback) => {
    if (index === undefined) {
      throw Error('Index of device not specified.');
    } else if(devices[index] === undefined) {
      throw Error('Device not found.');
    } else {
      try {
        devices[index].parser.on(event, callback);
      } catch (err) {
        console.error(err);
        throw err;
      }
    }
  }

  static once = (index, event, callback) => {
    if (index === undefined) {
      throw Error('Index of device not specified.');
    } else if(devices[index] === undefined) {
      throw Error('Device not found.');
    } else {
      try {
        devices[index].parser.once(event, callback);
      } catch (err) {
        console.error(err);
        throw err;
      }
    }
  }


  /**
   *
   * @param {number} index Index of device.
   * @returns {void}
   * @throws {Error} Error if index is undefined.
   * @throws {Error} Error if device not found.
   * @throws {Error} Error if error during closing.
   *
   */
  static close = (index) => {
    if (index === undefined) {
      throw Error('Index of device not specified.');
    } else if (devices[index] === undefined) {
      console.log("No usb device was found. Nothing to close.");
    } else {
      try {
        if (devices[index].port === null) {
          console.log("No usb device was found. Nothing to close.");
        } else {
          devices[index].port.close();
          devices[index].port.once('close', () => {
            console.log("Serial port closed.");
          });
        }
      } catch (err) {
        console.error(err);
        throw err;
      }
    }
  }

  /**
   *
   * @param {number} index Index of device.
   * @param {string} data Data to be written.
   * @returns {void}
   * @throws {Error} Error if index is undefined.
   * @throws {Error} Error if device not found.
   * @throws {Error} Error if error during writing.
   *
   */
  static write = (index, data) => {
    if (index === undefined) {
      throw Error('Index of device not specified.');
    } else if(devices[index] === undefined) {
      throw Error('Device not found.');
    } else {
      try {
        devices[index].port.write(data);
      } catch (err) {
        console.error(err);
        throw err;
      }
    }
  }

}

module.exports = { Device, DeviceInstantiate };