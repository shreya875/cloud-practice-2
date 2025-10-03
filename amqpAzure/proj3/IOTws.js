const mqtt = require("mqtt");
const crypto = require("crypto");
 
// 🔑 IoT Hub details
//const iotHubName = "<your-iothub-name>"; // e.g. myiothub123
//const deviceId = "<your-device-id>";
//const deviceKey = "<device-primary-key>"; // from Azure IoT Hub device
//const host = `${iotHubName}.azure-devices.net`; // define host early
const iotHubName = "IOThub79";
const host = `${iotHubName}.azure-devices.net`;
const deviceId = "device12";
const deviceKey = "a6zdJ10YbBTxvbV3GNDbxpEOvS2+nZlHeAIoTEvHd3o="; //from device primary key

//const apiVersion = "2020-09-30";
// 📌 Generate SAS token
function generateSasToken(resourceUri, key, expiryInMins) {
  const expiry = Math.floor(Date.now() / 1000) + expiryInMins * 60;
  const stringToSign = encodeURIComponent(resourceUri) + "\n" + expiry;
  const hmac = crypto.createHmac("sha256", Buffer.from(key, "base64"));
  hmac.update(stringToSign);
  const signature = encodeURIComponent(hmac.digest("base64"));
 
  return `SharedAccessSignature sr=${encodeURIComponent(resourceUri)}&sig=${signature}&se=${expiry}`;
}
 
// ✅ resourceUri after host is defined
const resourceUri = `${host}/devices/${deviceId}`;
const sasToken = generateSasToken(resourceUri, deviceKey, 60); // valid 1 hr
 
// 🔌 Connect over MQTT/WebSockets
const options = {
  clientId: deviceId,
  username: `${host}/${deviceId}/?api-version=2020-09-30`,
  password: sasToken,
  protocol: "wss",   // Use WebSocket Secure
  port: 443,
};
 
const client = mqtt.connect(`wss://${host}/$iothub/websocket`, options);
 
client.on("connect", () => {
  console.log("✅ Connected to IoT Hub over WebSockets");
 
  // Send telemetry
  const message = JSON.stringify({ temperature: 28, humidity: 65 });
  client.publish(`devices/${deviceId}/messages/events/`, message, {}, (err) => {
    if (err) {
      console.error("⚠️ Error sending message:", err);
    } else {
      console.log("📤 Telemetry sent:", message);
    }
  });
});
 
client.on("error", (err) => {
  console.error("❌ Connection error:", err);
});
 
client.on("close", () => {
  console.log("🔌 Connection closed");
});