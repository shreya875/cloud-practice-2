const ModbusRTU = require('modbus-serial');
const { Client, Message } = require('azure-iot-device');
const { Mqtt } = require('azure-iot-device-mqtt');

const MODBUS_IP = '127.0.0.1';      // IP of Modbus slave (localhost for testing)
const MODBUS_PORT = 5020;           // Port of Modbus slave
const MODBUS_ID = 1;                // Modbus Unit ID


const connectionString = "HostName=IOThub79.azure-devices.net;DeviceId=device12;SharedAccessKeyName=iothubowner;SharedAccessKey=Hrb6TzOo7QuLYC4b+Oe723lOa3QC04Cp4AIoTA46Kdc=";

const modbusClient = new ModbusRTU();
const iotClient = Client.fromConnectionString(connectionString, Mqtt);

async function connectModbus() {
  try {
    await modbusClient.connectTCP(MODBUS_IP, { port: MODBUS_PORT });
    modbusClient.setID(MODBUS_ID);
    console.log('Connected to Modbus slave device');
  } catch (err) {
    console.error('Failed to connect to Modbus slave:', err);
    process.exit(1);
  }
}

async function sendDataToAzure(temperature, vibration) {
  try {
    const payload = JSON.stringify({
      temperature,
      vibration,
      timeStamp: new Date().toISOString()
    });

    const message = new Message(payload);
    await iotClient.sendEvent(message);
    console.log('Sent data to Azure IoT Hub:', payload);
  } catch (err) {
    console.error('Failed to send data to Azure IoT Hub:', err);
  }
}

async function readModbusAndSend() {
  try {
    const data = await modbusClient.readHoldingRegisters(0, 2);
    const temperature = data.data[0];
    const vibration = data.data[1];
    console.log(`Read from Modbus: temperature=${temperature}, vibration=${vibration}`);

    await sendDataToAzure(temperature, vibration);
  } catch (err) {
    console.error('Error reading Modbus registers or sending data:', err);
  }
}

async function main() {
  try {
    await iotClient.open();
    console.log('Connected to Azure IoT Hub');

    await connectModbus();

    setInterval(readModbusAndSend, 2000);
  } catch (err) {
    console.error('Initialization error:', err);
  }
}

main();
