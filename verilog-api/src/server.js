import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto'; // Import crypto module for hashing
import { getStorageService, initializeSynapse } from './synapseClient.js';

// We need to import Synapse to access the download method
// Assuming it's exported from the SDK
import { Synapse } from '@filoz/synapse-sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));
// Middleware to serve static files (for downloading)
app.use(express.static('public'));

// Helper function to get a Synapse instance
// Since download is a method on Synapse, not StorageService
async function getSynapseInstance() {
  // This will ensure Synapse is initialized
  await initializeSynapse();
  // We need to find a way to get the synapse instance
  // Let's re-initialize it to get the instance
  // Note: This might not be the most efficient way if initializeSynapse has side effects
  // A better approach might be to export the synapse instance from synapseClient.js
  // For now, we'll re-create it with the same config
  const synapse = await Synapse.create({
    privateKey: process.env.PRIVATE_KEY,
    rpcURL: process.env.RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1', // Use env var or default to calibration
    withCDN: true,
    authorization: process.env.GLIF_TOKEN ? `Bearer ${process.env.GLIF_TOKEN}` : undefined
  });
  return synapse;
}

app.post('/upload-log', async (req, res) => {
  try {
    const logData = req.body; // Expecting JSON log data

    // 1. Validate required properties
    if (!logData) {
        return res.status(400).json({ error: 'Log data is required.' });
    }
    
    if (typeof logData.sourceId !== 'string' || logData.sourceId.trim() === '') {
        return res.status(400).json({ error: 'Log data must include a non-empty "sourceId" string.' });
    }
    
    if (typeof logData.eventType !== 'string' || logData.eventType.trim() === '') {
        return res.status(400).json({ error: 'Log data must include a non-empty "eventType" string.' });
    }
    
    // 2. Validate timestamp
    if (!logData.timestamp) {
        return res.status(400).json({ error: 'Log data must include a "timestamp".' });
    }
    
    const timestamp = new Date(logData.timestamp);
    if (isNaN(timestamp.getTime())) {
        return res.status(400).json({ error: 'Log data "timestamp" must be a valid ISO 8601 date string.' });
    }

    // 3. Add a hash of the log data
    // Create a deep copy of logData to avoid modifying the original object for hashing
    const logDataForHashing = JSON.parse(JSON.stringify(logData));
    // Remove the hash property if it exists to prevent self-referencing in the hash
    delete logDataForHashing.logHash;
    
    // Normalize the object for consistent hashing (sort keys)
    const normalizedLogDataString = JSON.stringify(logDataForHashing, Object.keys(logDataForHashing).sort());
    const logHash = crypto.createHash('sha256').update(normalizedLogDataString).digest('hex');
    
    // Add the hash to the log data
    const logDataWithHash = {
      ...logData,
      logHash: logHash
    };

    // Convert log data with hash to bytes
    const dataToUpload = new TextEncoder().encode(JSON.stringify(logDataWithHash, null, 2));

    // Get storage service instance
    const storage = await getStorageService();

    // Upload to Filecoin
    const result = await storage.upload(dataToUpload, {
      onUploadComplete: (commp) => {
        console.log(`Log upload complete! CommP: ${commp}`);
      }
    });

    res.status(200).json({ 
      message: 'Log data uploaded successfully.', 
      commp: result.commp,
      logHash: logHash // Return the hash to the client
    });
  } catch (error) {
    console.error('Error uploading log:', error);
    res.status(500).json({ error: 'Failed to upload log data.' });
  }
});

// New endpoint to verify an event by its CommP
app.post('/verify-event', async (req, res) => {
  try {
    const { commp } = req.body;

    if (!commp || typeof commp !== 'string') {
      return res.status(400).json({ error: 'A valid "commp" string is required in the request body.' });
    }

    // Get storage service instance (ensures Synapse is initialized)
    const storage = await getStorageService();
    
    // Use the Synapse SDK's pieceStatus function to check the status of the piece
    const status = await storage.pieceStatus(commp);

    // Return the status information as JSON
    res.status(200).json({
      exists: status.exists,
      proofSetLastProven: status.proofSetLastProven,
      proofSetNextProofDue: status.proofSetNextProofDue
    });
    
  } catch (error) {
    console.error('Error verifying event:', error);
    // Differentiate between client errors (4xx) and server errors (5xx)
    if (error.message && (error.message.includes('Invalid CommP') || error.code === 'INVALID_INPUT')) {
      res.status(400).json({ error: `Invalid CommP provided: ${error.message}` });
    } else {
      res.status(500).json({ error: 'Failed to verify event status.' });
    }
  }
});

// New endpoint to download log data by its CommP
app.get('/download-log/:commp', async (req, res) => {
  try {
    const { commp } = req.params;

    if (!commp || typeof commp !== 'string') {
      return res.status(400).json({ error: 'A valid "commp" parameter is required in the URL.' });
    }

    // Get a Synapse instance to use the download method
    const synapse = await getSynapseInstance();
    
    // Use the Synapse SDK's download function to retrieve the data
    // We'll use withCDN for potentially faster downloads
    const data = await synapse.download(commp, { withCDN: true });

    // Set appropriate headers for file download
    // Assuming the data is JSON (as we're storing logs)
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="log-${commp}.json"`
    });
    
    // Send the downloaded data
    // Decode the Uint8Array to a string
    const decodedData = new TextDecoder().decode(data);
    res.status(200).send(decodedData);
    
  } catch (error) {
    console.error('Error downloading log:', error);
    // Differentiate between client errors (4xx) and server errors (5xx)
    if (error.message && (error.message.includes('Invalid CommP') || error.message.includes('not found') || error.code === 'INVALID_INPUT')) {
      res.status(404).json({ error: `Log data not found for CommP: ${req.params.commp}` });
    } else {
      res.status(500).json({ error: 'Failed to download log data.' });
    }
  }
});


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running.' });
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  // Initialize Synapse client on startup
  try {
    await initializeSynapse();
  } catch (err) {
    console.error('Critical error during startup:', err);
    process.exit(1); // Exit if critical setup fails
  }
});