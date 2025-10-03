const coap = require('coap');

let sensorData = {
  temp: 0,
  vibration: 0
};

// Simulate new sensor readings every 2 seconds
setInterval(() => {
  sensorData.temp = Math.floor(20 + Math.random() * 20);
  sensorData.vibration = Math.floor(Math.random() * 5);
  console.log('📡 Sensor Updated:', sensorData);
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
