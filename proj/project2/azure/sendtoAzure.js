const { Client, Message } = require('azure-iot-device')
const { Mqtt } = require('azure-iot-device-mqtt')
const Modbus = require('jsmodbus')
const net = require('net')

// Azure IoT connection string
const connString = "HostName=IOThub79.azure-devices.net;DeviceId=device12;SharedAccessKeyName=iothubowner;SharedAccessKey=Hrb6TzOo7QuLYC4b+Oe723lOa3QC04Cp4AIoTA46Kdc="

const client = Client.fromConnectionString(connString, Mqtt)

// Modbus TCP slave connection settings
const MODBUS_HOST = '127.0.0.1'
const MODBUS_PORT = 5020
const POLL_INTERVAL = 3000

// Create Modbus socket and client
const socket = new net.Socket()
const modbusClient = new Modbus.client.TCP(socket, 1)

socket.connect(MODBUS_PORT, MODBUS_HOST, () => {
  console.log('Connected to Modbus Slave')
})

socket.on('error', (err) => {
  console.error('Modbus socket error:', err)
})

// Function to poll modbus and send to Azure
async function sendDataToAzure() {
  try {
    const resp = await modbusClient.readHoldingRegisters(0, 2)

    const buffer = resp.response._body._valuesAsBuffer
    const temperature = buffer.readUInt16BE(0)
    const vibration = buffer.readUInt16BE(2)

    const payload = JSON.stringify({
      temperature,
      vibration,
      timeStamp: new Date().toISOString()
    })

    const message = new Message(payload)
    console.log('Sending to Azure IoT Hub:', payload)

    await client.sendEvent(message)

  } catch (err) {
    console.error('Error reading Modbus or sending to Azure:', err)
  }
}

// Connect to Azure IoT Hub and start polling
client.open()
  .then(() => {
    console.log('Device connected to Azure IoT Hub')
    setInterval(() => {
      sendDataToAzure()
    }, POLL_INTERVAL)
  })
  .catch((err) => {
    console.error('Azure IoT Hub connection failed:', err)
  })
