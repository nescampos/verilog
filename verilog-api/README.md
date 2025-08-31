# Verilog API

This is the core API component of the Verilog project. It provides endpoints to receive log data, store it on the Filecoin network for data availability, and verify its storage status.

## Features

- **Log Upload**: Receives structured log data via HTTP POST, validates it, adds a cryptographic hash for integrity, and stores it on Filecoin.
- **Event Verification**: Allows checking the storage status of a log on Filecoin using its CommP (Piece Commitment).
- **Log Download**: Enables downloading previously stored log data using its CommP.

## Requirements

- Node.js (v14 or higher recommended)
- npm (v6 or higher)
- A Filecoin wallet with:
  - A private key for the Synapse SDK.
  - Sufficient USDFC test tokens for storage fees (on Calibration testnet).
- A Glif API token (optional, for higher rate limits).

## Setup

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

## Running the API

Start the server in development mode:
```bash
npm run dev
```

Or for production:
```bash
npm start
```

The API will be available at `http://localhost:3000` (or the port specified in your `.env`).

## API Endpoints

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