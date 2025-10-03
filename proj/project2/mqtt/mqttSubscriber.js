const mqtt = require('mqtt')
const brokerUrl = 'mqtt://test.mosquitto.org'

const client = mqtt.connect(brokerUrl)

const topics = [
  'factory1/line1/cnc1/temperature',
  'factory1/line1/cnc1/vibration'
]

client.on('connect', () => {
  console.log('Subscriber1 connected to broker')
  client.subscribe(topics, (err) => {
    if (!err) {
      console.log('Subscriber1 subscribed to topics')
    } else {
      console.log('Subscriber1 failed to subscribe')
    }
  })
})

client.on('message', (topic, message) => {
  const value = parseFloat(message.toString())

  if (topic.includes('temperature')) {
    console.log('Subscriber1 Temp:', value)
  }
  if (topic.includes('vibration')) {
    console.log('Subscriber1 Vibration:', value)
  }
})
