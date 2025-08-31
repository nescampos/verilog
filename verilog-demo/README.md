# Verilog Demo

This is a demonstration web application showcasing how to use the Verilog project to create a verifiable Web 2.0 application. It automatically logs its own HTTP requests and sends them to the Verilog API for storage on Filecoin. It also provides a UI to manually verify the status of stored logs.

## Features

- **Automatic Logging**: Captures all HTTP requests made to the demo app and sends them as structured logs to the Verilog API.
- **Manual Verification UI**: Provides a simple web interface to check the Filecoin storage status of any log using its CommP.
- **Example API Endpoints**: Includes sample GET and POST endpoints to generate loggable actions.

## Requirements

- Node.js (v14 or higher recommended)
- npm (v6 or higher)
- A running instance of the Verilog API.

## Setup

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

## Running the Demo

Start the server in development mode:
```bash
npm run dev
```

Or for production:
```bash
npm start
```

The demo application will be available at `http://localhost:3001`.

## How It Works

1.  **Access the Web Interface**: Open `http://localhost:3001` in your browser.
2.  **Generate Logs**: Click the "GET /api/data" or "POST /api/data" buttons. Each click generates an HTTP request to the demo app's own API.
3.  **Automatic Logging**: A middleware in `server.js` captures details of every request (timestamp, method, URL, headers, IP, response time, etc.), structures it into a log entry (adding required `sourceId` and `eventType`), and asynchronously sends it to the Verilog API. The `sourceId` is set to `'filecoin-log-demo'` and `eventType` to `'user_action'`.
4.  **Console Output**: Check the terminal where you started `verilog-demo`. You should see logs indicating that the log data was sent to the API, along with the returned `CommP` and `logHash`. These identifiers are crucial for later verification and retrieval.
5.  **Manual Verification**: In the web UI, copy a `CommP` from your terminal logs (or one you obtained elsewhere) and paste it into the "Verify Event" input field. Click "Verify Event". The demo app's server will call the Verilog API to check the status on Filecoin and display the result (exists, last proven, next proof due) in the UI.