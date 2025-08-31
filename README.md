# Verilog: Making Web 2.0 Applications Verifiable with Filecoin

Verilog is a project designed to bridge the gap between traditional Web 2.0 applications and the verifiable, decentralized world of Web3. Its core focus is to provide a straightforward way for Web 2.0 applications to achieve **verifiability** and **data availability** by leveraging the Filecoin network.

By "verifiable," we mean the ability to prove that a specific action or event occurred within an application at a particular time. By "data availability," we mean ensuring that the record of that event is stored in a permanent, decentralized, and censorship-resistant manner.

This project is particularly useful for applications that require an audit trail, proof of execution, or long-term archival of critical events (e.g., financial transactions, user actions, system logs).

## How It Works

Verilog provides a three-tier architecture:

1.  **Logging & Submission**: Your Web 2.0 application generates structured log entries for events you want to verify (e.g., "User X performed action Y at time Z"). These logs are sent to the Verilog API.
2.  **Storage on Filecoin**: The Verilog API takes these logs, adds a cryptographic hash for integrity, and stores the data on the Filecoin network. Filecoin ensures data availability through its decentralized storage providers and cryptographic proofs.
3.  **Verification & Retrieval**: Anyone can later verify that a specific log was indeed stored on Filecoin by using its unique identifier (CommP). They can also retrieve the original log data.

This creates a trustless system where the application owner cannot easily deny that an event happened, as the proof exists on a public, immutable (in terms of availability and proof-of-existence) network.

## Project Structure

This repository contains three main components:

### 1. `verilog-api`

The central REST API that handles log submission, interacts with the Filecoin network via the Synapse SDK, and provides endpoints for verification and retrieval.

#### Features

- **Log Upload**: Receives structured log data via HTTP POST, validates it, adds a cryptographic hash for integrity, and stores it on Filecoin.
- **Event Verification**: Allows checking the storage status of a log on Filecoin using its CommP (Piece Commitment).
- **Log Download**: Enables downloading previously stored log data using its CommP.

#### Requirements

- Node.js (v14 or higher recommended)
- npm (v6 or higher)
- A Filecoin wallet with:
  - A private key for the Synapse SDK.
  - Sufficient USDFC test tokens for storage fees (on Calibration testnet).
- A Glif API token (optional, for higher rate limits).

#### Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd verilog-api
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment variables**:
   Create a `.env` file in the root of this directory (`verilog-api`) based on the `.env.example` file (you might need to create this file). You will need to set:
   ```
   PRIVATE_KEY=your_private_key_here
   # Optional
   GLIF_TOKEN=your_glif_token_here
   PORT=3000 # Optional, defaults to 3000
   ```
4. **Setup Filecoin Payments**:
   Before storing data, you need to deposit USDFC tokens and approve the Pandora service. Run the setup script:
   ```bash
   npm run setup-payments
   ```
   This is a one-time setup (or whenever funds need to be replenished/approved).

#### Running the API

Start the server in development mode:
```bash
npm run dev
```

Or for production:
```bash
npm start
```

The API will be available at `http://localhost:3000` (or the port specified in your `.env`).

#### API Endpoints

- `POST /upload-log`: Upload a new log entry to Filecoin.
  - **Request Body**: JSON object with `sourceId` (string), `eventType` (string), `timestamp` (ISO 8601 string), and any other custom data.
  - **Response**: JSON with `message`, `commp`, and `logHash`.
- `POST /verify-event`: Check the status of a stored log on Filecoin.
  - **Request Body**: JSON object with `commp` (string).
  - **Response**: JSON with `exists` (boolean), `proofSetLastProven` (string/ISO date), `proofSetNextProofDue` (string/ISO date).
- `GET /download-log/:commp`: Download the stored log data.
  - **Path Parameter**: `commp` (string).
  - **Response**: JSON object of the original log data.
- `GET /health`: Basic health check.
  - **Response**: JSON with `status` and `message`.

### 2. `verilog-client`

A JavaScript client library that simplifies the integration of the Verilog API into other applications.

#### Features

- **Send Log**: Easily send structured log data to the Verilog API for storage on Filecoin.
- **Verify Event**: Check the storage status of a log on Filecoin.
- **Download Log**: Retrieve previously stored log data.

#### Requirements

- Node.js (v14 or higher recommended) if used in a Node.js environment.
- A running instance of the Verilog API.

#### Installation

This library is designed to be used as a local package or directly included in projects. If you are using it in another project, you can copy the `src/index.js` file or link it.

For direct usage in a Node.js script, ensure `node-fetch` is available (for Node.js versions < 18):
```bash
npm install node-fetch
```

#### Usage

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

### 3. `verilog-demo`

A demonstration web application showcasing how a typical Web 2.0 app can be made verifiable. It automatically logs its own actions and provides a UI for manual verification.

#### Features

- **Automatic Logging**: Captures all HTTP requests made to the demo app and sends them as structured logs to the Verilog API.
- **Manual Verification UI**: Provides a simple web interface to check the Filecoin storage status of any log using its CommP.
- **Example API Endpoints**: Includes sample GET and POST endpoints to generate loggable actions.

#### Requirements

- Node.js (v14 or higher recommended)
- npm (v6 or higher)
- A running instance of the Verilog API.

#### Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd verilog-demo
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Ensure the Verilog API is running**:
   The demo app expects the Verilog API to be running at `http://localhost:3000`. If your API instance is running elsewhere, you'll need to update the `logClient` initialization in `server.js`.

#### Running the Demo

Start the server in development mode:
```bash
npm run dev
```

Or for production:
```bash
npm start
```

The demo application will be available at `http://localhost:3001`.

#### How It Works

1.  **Access the Web Interface**: Open `http://localhost:3001` in your browser.
2.  **Generate Logs**: Click the "GET /api/data" or "POST /api/data" buttons. Each click generates an HTTP request to the demo app's own API.
3.  **Automatic Logging**: A middleware in `server.js` captures details of every request (timestamp, method, URL, headers, IP, response time, etc.), structures it into a log entry (adding required `sourceId` and `eventType`), and asynchronously sends it to the Verilog API. The `sourceId` is set to `'filecoin-log-demo'` and `eventType` to `'user_action'`.
4.  **Console Output**: Check the terminal where you started `verilog-demo`. You should see logs indicating that the log data was sent to the API, along with the returned `CommP` and `logHash`. These identifiers are crucial for later verification and retrieval.
5.  **Manual Verification**: In the web UI, copy a `CommP` from your terminal logs (or one you obtained elsewhere) and paste it into the "Verify Event" input field. Click "Verify Event". The demo app's server will call the Verilog API to check the status on Filecoin and display the result (exists, last proven, next proof due) in the UI.

## Getting Started

To use Verilog:

1.  Set up and run the `verilog-api`.
2.  Integrate the `verilog-client` into your Web 2.0 application to send logs.
3.  (Optional) Use the `verilog-demo` as a reference or starting point.