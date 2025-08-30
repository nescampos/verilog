import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto'; // Import crypto module for hashing
import { getStorageService, initializeSynapse } from './synapseClient.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' })); // Adjust limit as needed for log data

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

    if (typeof logData.timestamp !== 'string' || logData.timestamp.trim() === '') {
        return res.status(400).json({ error: 'Log data must include a non-empty "timestamp" string.' });
    }

    // 2. Add a hash of the log data
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