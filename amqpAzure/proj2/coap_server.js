const coap = require('coap');

let sensorData = {
  temperature: 0,
  vibration: 0,
  timestamp: new Date().toISOString()
};

// Simulate new sensor readings every 2 seconds
setInterval(() => {
  sensorData.temperature = Math.floor(20 + Math.random() * 20);
  // sensorData.vibration = Math.floor(Math.random() * 5);
  sensorData.vibration = (Math.random() * 1.3).toFixed(2);
  sensorData.timestamp = new Date().toISOString();
  console.log('Sensor Updated:', sensorData);
}, 2000);

// CoAP server
const server = coap.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/sensor') {
    res.setOption('Content-Format', 'application/json');
    res.end(JSON.stringify(sensorData));
  } else {
    res.code = '4.04';
    res.end('Not Found');
  }
});

server.listen(() => {
  console.log('CoAP server listening at coap://localhost:5683/sensor');
});
