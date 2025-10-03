const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require("fs");
const path = require("path");

const blobConnectionString = "DefaultEndpointsProtocol=https;AccountName=mystorage3467;AccountKey=HocIihynaStcHQ+Leop5QL6MGwz+kAiMqk3xQc6kO0TXCfACvJuCkbhJnmrkXM/teyYvzM1/ljmP+AStYLP7Jw==;EndpointSuffix=core.windows.net"; 
const containerName = "iotdata";
const TIMESTAMP_FILE = path.join(__dirname, "last_processed.json");
const DELAY_MS = 40000; // 40 seconds
const TIME_BUFFER_MS = 5000; // 5 seconds buffer

// Load last processed info from file
function loadLastProcessedInfo() {
    try {
        if (fs.existsSync(TIMESTAMP_FILE)) {
            const data = fs.readFileSync(TIMESTAMP_FILE, "utf-8");
            const parsed = JSON.parse(data);
            return {
                time: new Date(parsed.lastProcessedTime),
                blobName: parsed.lastProcessedBlob || ""
            };
        }
    } catch (err) {
        console.error("Failed to read timestamp file:", err.message);
    }
    return { time: new Date(0), blobName: "" }; // default: epoch
}

// Save latest processed info to file
function saveLastProcessedInfo(time, blobName) {
    const data = {
        lastProcessedTime: time.toISOString(),
        lastProcessedBlob: blobName
    };
    fs.writeFileSync(TIMESTAMP_FILE, JSON.stringify(data), "utf-8");
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

async function readRecentBlobs() {
    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        const { time: lastProcessedTime, blobName: lastProcessedBlob } = loadLastProcessedInfo();
        let newLatestTime = lastProcessedTime;
        let newLatestBlob = lastProcessedBlob;

        // Apply buffer
        const adjustedLastProcessedTime = new Date(lastProcessedTime.getTime() - TIME_BUFFER_MS);

        const blobsToProcess = [];

        // Step 1: List and filter
        for await (const blob of containerClient.listBlobsFlat()) {
            const blobLastModified = blob.properties.lastModified;

            const isNewer = blobLastModified > adjustedLastProcessedTime;
            const isEqualAndNewerName = (
                blobLastModified.getTime() === adjustedLastProcessedTime.getTime() &&
                blob.name > lastProcessedBlob
            );

            if (isNewer || isEqualAndNewerName) {
                blobsToProcess.push({ blob, blobLastModified });
            }
        }

        if (blobsToProcess.length === 0) {
            console.log("No new blobs to process.");
            return;
        }

        // Step 2: Sort by timestamp (desc), then name (asc)
        blobsToProcess.sort((a, b) => {
            if (b.blobLastModified - a.blobLastModified !== 0) {
                return b.blobLastModified - a.blobLastModified; // latest first
            }
            return a.blob.name.localeCompare(b.blob.name); // alphabetical
        });

        console.log(`Found ${blobsToProcess.length} new blob(s). Waiting 40 seconds before processing...`);
        await delay(DELAY_MS);

        // Step 3: Process blobs
        for (const { blob, blobLastModified } of blobsToProcess) {
            try {
                const blobClient = containerClient.getBlobClient(blob.name);
                const downloadResponse = await blobClient.download(0);
                const content = await streamToString(downloadResponse.readableStreamBody);

                console.log(`\nContent of ${blob.name} (Modified: ${blobLastModified.toISOString()}):\n`);
                console.log(content);

                // Update latest info
                if (
                    blobLastModified > newLatestTime ||
                    (blobLastModified.getTime() === newLatestTime.getTime() && blob.name > newLatestBlob)
                ) {
                    newLatestTime = blobLastModified;
                    newLatestBlob = blob.name;
                }

            } catch (err) {
                console.error(`Error processing ${blob.name}:`, err.message);
            }
        }

        // Step 4: Save new latest timestamp + blob name
        saveLastProcessedInfo(newLatestTime, newLatestBlob);
        console.log(`\nUpdated last processed time: ${newLatestTime.toISOString()}`);
        console.log(`Updated last processed blob: ${newLatestBlob}`);

    } catch (err) {
        console.error("Error in blob processing:", err.message);
    }
}

// Run it
readRecentBlobs();
