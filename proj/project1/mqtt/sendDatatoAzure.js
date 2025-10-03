const {Client, Message} =require('azure-iot-device');

const {Mqtt} = require('azure-iot-device-mqtt');
const {timeStamp} = require('console');

const connString = "HostName=IOThub79.azure-devices.net;DeviceId=device12;SharedAccessKeyName=iothubowner;SharedAccessKey=Hrb6TzOo7QuLYC4b+Oe723lOa3QC04Cp4AIoTA46Kdc="

const client = Client.fromConnectionString(connString, Mqtt);

async function sendData(){

    const temp = 20 + Math.random()*10;
    const humidity = 40 + Math.random()*20;

    const payload = JSON.stringify({temp, humidity, timeStamp:new Date().toISOString()})

    const msg = new Message(payload);
    console.log("Sending the value to mqtt", payload);

    await client.sendEvent(msg);

}

client.open()
.then(()=>{
    console.log("Device connected to Azure IoT Hub")
    setInterval(()=>{
        sendData()
    }, (3000))
})
.catch(err=>console.log("Connection failed", err))