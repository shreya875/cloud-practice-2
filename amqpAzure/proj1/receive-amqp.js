const {EventhubClient, EventHubConsumerClient} = require('@azure/event-hubs')

const connString = "Endpoint=sb://iothub-ns-iothub79-67005161-834729fdfe.servicebus.windows.net/;SharedAccessKeyName=iothubowner;SharedAccessKey=Hrb6TzOo7QuLYC4b+Oe723lOa3QC04Cp4AIoTA46Kdc=;EntityPath=iothub79"

const consumegrp = "$Default";

async function main(){
    const client = new EventHubConsumerClient(consumegrp, connString);

    console.log("Connected to IoT Hub...")    

    const subscription = client.subscribe({
        processEvents: async (events, context)=>{
            for(const event of events){
                console.log(event)
                console.log('$context.partitionId, $even.body')
            }
        }
    })

    processError: async(error, context)=>{
        console.log("Error",error)
    }

    setTimeout(async()=>{
        await subscription.close();
        await client.close();
        console.log("Closed")
    }, 30000)
}

main().catch(console.error)