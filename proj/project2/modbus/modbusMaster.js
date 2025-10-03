const Modbus = require('jsmodbus')
const net = require('net')
const mqtt = require('mqtt')

const MODBUS_PORT = 5020
const MODBUS_HOST = '127.0.0.1'
const POLL_INTERVAL = 3000 // ms

const brokerUrl = 'mqtt://test.mosquitto.org'

const client = mqtt.connect(brokerUrl)

const topics = {
  temperature: 'factory1/line1/cnc1/temperature',
  vibration: 'factory1/line1/cnc1/vibration'
}

client.on('connect', () => {
  console.log('Connected to MQTT broker')
})

const socket = new net.Socket()
const modbusClient = new Modbus.client.TCP(socket, 1) // unit id 1

socket.connect(MODBUS_PORT, MODBUS_HOST, () => {
  console.log('Connected to Modbus Slave')
})

socket.on('error', (err) => {
  console.error('Modbus socket error:', err)
})

function pollData() {
  // Read 2 holding registers starting from 0
  modbusClient.readHoldingRegisters(0, 2)
    .then((resp) => {
      const temp = resp.response._body._valuesAsBuffer.readUInt16BE(0)
      const vibration = resp.response._body._valuesAsBuffer.readUInt16BE(2)

      console.log(`Polled data -> Temp: ${temp}, Vibration: ${vibration}`)

      // Publish to MQTT
      client.publish(topics.temperature, temp.toString())
      client.publish(topics.vibration, vibration.toString())
    })
    .catch((err) => {
      console.error('Modbus read error:', err)
    })
}

setInterval(pollData, POLL_INTERVAL)
