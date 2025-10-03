const coap = require('coap');
const { Client, Message } = require('azure-iot-device');
const { Mqtt } = require('azure-iot-device-mqtt');

const COAP_URL = 'coap://localhost/sensor';

const connectionString = "HostName=IOThub79.azure-devices.net;DeviceId=device12;SharedAccessKey=a6zdJ10YbBTxvbV3GNDbxpEOvS2+nZlHeAIoTEvHd3o=";
const client = Client.fromConnectionString(connectionString, Mqtt);

client.open((err) => {
  if (err) {
    console.error("Azure connection failed:", err.message);
    return;
  }

  console.log("Connected to Azure IoT Hub via MQTT");

  const fetchAndSend = () => {
    const req = coap.request(COAP_URL);

    req.on('response', (res) => {
      const payload = res.payload.toString();
      console.log("CoAP response:", payload);

      const message = new Message(payload);

      client.sendEvent(message, (err) => {
        if (err) {
          console.error("Failed to send to Azure:", err.message);
        } else {
          console.log("Sent to Azure IoT Hub:", payload);
        }
      });
    });

    req.on('error', (err) => {
      console.error("CoAP request error:", err.message);
    });

    req.end();
  };

  setInterval(fetchAndSend, 5000); 
});
