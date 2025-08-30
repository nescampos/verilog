import { setupPayments } from './synapseClient.js';

// This script is intended to be run as a standalone command to setup payments
// It's not part of the main server logic and shouldn't be exposed as an API endpoint

console.log('Starting payment setup process...');

try {
  await setupPayments();
  console.log('Payment setup process finished successfully.');
  process.exit(0); // Exit successfully
} catch (error) {
  console.error('Payment setup process failed:', error);
  process.exit(1); // Exit with error code
}