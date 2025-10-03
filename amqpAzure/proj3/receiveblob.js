const {BlobServiceClient} = require("@azure/storage-blob");

const blobConnectionString = "DefaultEndpointsProtocol=https;AccountName=mystorage3467;AccountKey=HocIihynaStcHQ+Leop5QL6MGwz+kAiMqk3xQc6kO0TXCfACvJuCkbhJnmrkXM/teyYvzM1/ljmP+AStYLP7Jw==;EndpointSuffix=core.windows.net"

const containerName = "iotdata";
const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

async function readAllBlobs(){
    try{
        //1. Create service client
        const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);

        //2. Get container data
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        //3. Look through all blobs in container
        for await (const blob of containerClient.listBlobsFlat()){
            console.log(`Found blob:${blob.name}`);

        //4. Get blob client
        const blobClient = containerClient.getBlobClient(blob.name);

        //5. Download Blob
        const downloadResponse = await blobClient.download(0);
        const content = await streamToString(downloadResponse.readableStreamBody);

        console.log(`Content of ${blob.name}:`, content);
    }
    }catch(err){
        console.error("Error:", err.message);
    }
}

//Helper: stream -> string
async function streamToString(readableStream){
    return new Promise((resolve, reject)=>{
        const chunks =[];
        readableStream.on("data", (data) => chunks.push(data.toString()));
        readableStream.on("end", () => resolve(chunks.join("")));
        readableStream.on("error", reject);
    });
}

//Run it
readAllBlobs();