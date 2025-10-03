const {Client, Message} =require('azure-iot-device');

const {Mqtt} = require('azure-iot-device-mqtt');
const {timeStamp} = require('console');

const connString = "HostName=IOThub79.azure-devices.net;DeviceId=device12;SharedAccessKeyName=iothubowner;SharedAccessKey=Hrb6TzOo7QuLYC4b+Oe723lOa3QC04Cp4AIoTA46Kdc="

const client = Client.fromConnectionString(connString, Mqtt);

client.open((err)=>{
    if(err){
        console.log("Connection Error", err);
    }else{
        console.log("Connected to Azure IoT Hub");
        client.on('message', (msg)=>{
            if(err){
                console.log("Message received from Azure IoT Hub", msg.getData());

                client.complete(msg, (err)=>{
                    if(err){
                        console.log("Error completion",err.toString())
                    }else{
                        console.log("Message and completion received successfully")
                    }
                })
            }
        })

    }
})