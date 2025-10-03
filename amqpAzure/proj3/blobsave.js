const {EventHubConsumerClient} = require("@azure/event-hubs");
const {BlobServiceClient} = require("@azure/storage-blob");

//-----------------------------CONFIG---------------------------------
//Azure Portal -> Your IoT Hub -> Hub Settings -> Build-in endpoints ->Event Hub compatible endpoint

const eventHubConnectionString = "Endpoint=sb://iothub-ns-iothub79-67005161-834729fdfe.servicebus.windows.net/;SharedAccessKeyName=iothubowner;SharedAccessKey=Hrb6TzOo7QuLYC4b+Oe723lOa3QC04Cp4AIoTA46Kdc=;EntityPath=iothub79"

const eventHubName = "iothub79"; //copy from portal
const consumerGroup = "$Default";

//Blob config. storage account -> Security + networking -> Access Key -> Key 1 connection string

const blobConnectionString = "DefaultEndpointsProtocol=https;AccountName=mystorage3467;AccountKey=HocIihynaStcHQ+Leop5QL6MGwz+kAiMqk3xQc6kO0TXCfACvJuCkbhJnmrkXM/teyYvzM1/ljmP+AStYLP7Jw==;EndpointSuffix=core.windows.net"
//Create the blob in Azure portal
const containerName = "iotdata"

//-------------------------INIT CLIENTS-------------------------------
const consumerClient = new EventHubConsumerClient(
    consumerGroup,
    eventHubConnectionString,
    eventHubName
);

const blobserviceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
const containerClient = blobserviceClient.getContainerClient(containerName);

//-------------------------Save to BLOB-------------------------------
async function savetoBlob(eventData){
    try{
        const blobName = `telemetry-${Date.now()}.json`
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const deviceId = 
            eventData?.systemProperties?.["iothub-connection-device-id"] ||
            eventData?.annotations?.["iothub-connection-device-id"] ||
            "unknown-device";

        const content = JSON.stringify({
            deviceId,
            timestamp: new Date().toISOString(),
            data: eventData.body
        });

        await blockBlobClient.upload(content, Buffer.byteLength(content));
        console.log("Saved to blob: ",blobName);
    }catch(err){
        console.log("Error saving to Blob: ", err.message);
    }
}

async function savetoCosmos(eventData){
    try{
        const item = {
            id: `${Date.now()}-${Math.random()}`,
            deviceId: eventData.systemProperties?.["iothub-connection-device-id"] || "unknown",
            timestamp: newDate().toISOString(),
            data: eventData.body
        };
        await container.items.create(item);
        console.log("Saved to Cosmos",item);
    }catch(err){
        console.error("Error saving to Cosmos:",err);
    }
}

//----------------------------Receive EVENTS--------------------------------
async function main(){
    console.log("Listening to IoT hub event...");

    const subscription = consumerClient.subscribe({
        processEvents: async(events, context)=>{
            for(const event of events){
                console.log("Incoming event:", event.body);
                await savetoCosmos(event)
            }
        },
        processError: async(err, context)=>{
            console.log("Error in event processing:",err)
        }
    });

    //Keep running
    process.on("SIGINT", async()=>{
        console.log("Closing...")
        await subscription.close();
        await consumerClient.close();
        process.exit(0);
    });
}

main().catch((err)=>{
    console.log("Fatal error:",err)
});