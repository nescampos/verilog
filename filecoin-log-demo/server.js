import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import FilecoinLogClient from './filecoin-log-client.js';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Initialize the Filecoin log client
const logClient = new FilecoinLogClient('http://localhost:3000'); // Default API endpoint

// Middleware to capture request logs
app.use(express.json({ limit: '10mb' }));

// Function to send log to Filecoin
async function sendLogToFilecoin(logData) {
  try {
    const result = await logClient.sendLog(logData);
    console.log(`Log sent successfully. CommP: ${result.commp}`);
    return result;
  } catch (error) {
    console.error('Error sending log to Filecoin:', error);
    // We don't throw the error to avoid disrupting the main request flow
  }
}

// Middleware to log all requests
app.use(async (req, res, next) => {
  // Create log entry
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip || req.connection.remoteAddress,
    statusCode: res.statusCode,
    responseTime: null // Will be updated after request is processed
  };

  // Capture response finish to calculate response time
  const startTime = Date.now();
  res.on('finish', async () => {
    const endTime = Date.now();
    logEntry.responseTime = endTime - startTime;
    logEntry.statusCode = res.statusCode;
    
    // Send log to Filecoin (non-blocking)
    sendLogToFilecoin(logEntry);
  });

  next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes for demo
app.get('/api/data', (req, res) => {
  res.json({ 
    message: 'This is sample data from the API',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/data', (req, res) => {
  res.json({ 
    message: 'Data successfully posted',
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Demo app listening at http://localhost:${PORT}`);
});