# Verilog Client

This is a JavaScript client library for interacting with the Verilog API. It simplifies the process of sending logs to Filecoin, verifying their storage status, and downloading them.

## Features

- **Send Log**: Easily send structured log data to the Verilog API for storage on Filecoin.
- **Verify Event**: Check the storage status of a log on Filecoin.
- **Download Log**: Retrieve previously stored log data.

## Requirements

- Node.js (v14 or higher recommended) if used in a Node.js environment.
- A running instance of the Verilog API.

## Installation

This library is designed to be used as a local package or directly included in projects. If you are using it in another project, you can copy the `src/index.js` file or link it.

For direct usage in a Node.js script, ensure `node-fetch` is available (for Node.js versions < 18):
```bash
npm install node-fetch
```

## Usage

1. Import the client:
   ```javascript
   // For ES Modules
   import FilecoinLogClient from './path/to/verilog-client/src/index.js';
   
   // Or for CommonJS (Node.js)
   // const { FilecoinLogClient } = require('./path/to/verilog-client/src/index.js');
   ```

2. Create an instance:
   ```javascript
   const client = new FilecoinLogClient('http://localhost:3000'); // URL of your Verilog API instance
   ```

3. Use the methods:
   ```javascript
   // Send a log
   const logData = {
     sourceId: 'my-web-app',
     eventType: 'user_login',
     timestamp: new Date().toISOString(),
     userId: '12345'
   };
   
   try {
     const result = await client.sendLog(logData);
     console.log('Log uploaded with CommP:', result.commp);
   } catch (error) {
     console.error('Error uploading log:', error);
   }

   // Verify an event
   try {
     const status = await client.verifyEvent('baga6ea4seaq...'); // Use actual CommP
     console.log('Event status:', status);
   } catch (error) {
     console.error('Error verifying event:', error);
   }
   
   // Download a log
   try {
     const log = await client.downloadLog('baga6ea4seaq...'); // Use actual CommP
     console.log('Downloaded log:', log);
   } catch (error) {
     console.error('Error downloading log:', error);
   }
   ```