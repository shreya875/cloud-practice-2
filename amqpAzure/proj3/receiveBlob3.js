const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require("fs");
const path = require("path");

const blobConnectionString = "Your_Azure_Connection_String_Here"; // ⚠️ Move this to .env
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

// Save latest processed time to file
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

async function readRecentBlobs() {
    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
        const containerClient = blobServiceClient.getContainerClient(containerName);

        const lastProcessedTime = loadLastProcessedTime();
        let newLatestTime = lastProcessedTime;

        const blobsToProcess = [];

        // Step 1: List and filter blobs by lastModified
        for await (const blob of containerClient.listBlobsFlat()) {
            const blobLastModified = blob.properties.lastModified;

            if (blobLastModified > lastProcessedTime && blobLastModified <= new Date()) {
                blobsToProcess.push({ blob, blobLastModified });
            }
        }

        if (blobsToProcess.length === 0) {
            console.log("No new blobs to process.");
            return;
        }

        // Step 2: Sort by lastModified descending
        blobsToProcess.sort((a, b) => b.blobLastModified - a.blobLastModified);

        console.log(`Found ${blobsToProcess.length} new blob(s). Waiting 40 seconds before processing...`);
        await delay(DELAY_MS); // Wait once

        // Step 3: Process blobs
        for (const { blob, blobLastModified } of blobsToProcess) {
            try {
                const blobClient = containerClient.getBlobClient(blob.name);
                const downloadResponse = await blobClient.download(0);
                const content = await streamToString(downloadResponse.readableStreamBody);

                console.log(`\nContent of ${blob.name} (Modified: ${blobLastModified.toISOString()}):\n`);
                console.log(content);

                // Track latest timestamp
                if (blobLastModified > newLatestTime) {
                    newLatestTime = blobLastModified;
                }

            } catch (err) {
                console.error(`Error processing ${blob.name}:`, err.message);
            }
        }

        // Step 4: Save last processed timestamp
        if (newLatestTime > lastProcessedTime) {
            saveLastProcessedTime(newLatestTime);
            console.log(`\nUpdated last processed time: ${newLatestTime.toISOString()}`);
        }

    } catch (err) {
        console.error("Error in blob processing:", err.message);
    }
}

// Run it
readRecentBlobs();
