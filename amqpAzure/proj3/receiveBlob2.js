const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require("fs");
const path = require("path");

const blobConnectionString = "DefaultEndpointsProtocol=https;AccountName=mystorage3467;AccountKey=HocIihynaStcHQ+Leop5QL6MGwz+kAiMqk3xQc6kO0TXCfACvJuCkbhJnmrkXM/teyYvzM1/ljmP+AStYLP7Jw==;EndpointSuffix=core.windows.net";
const containerName = "iotdata";

const TIMESTAMP_FILE = path.join(__dirname, "last_processed.json");
const DELAY_MS = 40000; // 40 seconds

// Load last processed time from file
function loadLastProcessedTime() {
    try {
        if (fs.existsSync(TIMESTAMP_FILE)) {
            const data = fs.readFileSync(TIMESTAMP_FILE, "utf-8");
            return new Date(JSON.parse(data).lastProcessedTime);
        }
    } catch (err) {
        console.error("Failed to read timestamp file:", err.message);
    }
    return new Date(0); // default: epoch
}

// Save the latest processed time to file
function saveLastProcessedTime(time) {
    fs.writeFileSync(TIMESTAMP_FILE, JSON.stringify({ lastProcessedTime: time.toISOString() }), "utf-8");
}

// Delay helper
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Convert stream to string
async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => chunks.push(data.toString()));
        readableStream.on("end", () => resolve(chunks.join("")));
        readableStream.on("error", reject);
    });
}

async function readAllBlobs() {
    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        const lastProcessedTime = loadLastProcessedTime();
        let newLatestTime = lastProcessedTime;

        for await (const blob of containerClient.listBlobsFlat()) {
            const blobLastModified = blob.properties.lastModified;

            if (blobLastModified > lastProcessedTime) {
                console.log(`New blob detected: ${blob.name}, will be processed in 40 seconds.`);

                await delay(DELAY_MS); // wait 40s before processing

                const blobClient = containerClient.getBlobClient(blob.name);
                const downloadResponse = await blobClient.download(0);
                const content = await streamToString(downloadResponse.readableStreamBody);

                console.log(`Content of ${blob.name} (after 40s):\n`, content);

                // Update last processed timestamp
                if (blobLastModified > newLatestTime) {
                    newLatestTime = blobLastModified;
                }
            } else {
                console.log(`Skipping already processed blob: ${blob.name}`);
            }
        }

        // Save latest processed time
        if (newLatestTime > lastProcessedTime) {
            saveLastProcessedTime(newLatestTime);
        }
    } catch (err) {
        console.error("Error:", err.message);
    }
}

// Run it
readAllBlobs();
