import { Synapse, RPC_URLS, TOKENS, CONTRACT_ADDRESSES } from '@filoz/synapse-sdk';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

let synapseInstance = null;
let isPaymentSetupDone = false; // Flag to track if payment setup has been attempted

// Function to setup payments (deposit and approve)
// This function is exported so it can be called independently
export async function setupPayments() {
  if (isPaymentSetupDone) {
    console.log('Payment setup already completed or attempted.');
    return;
  }

  try {
    console.log('Setting up payments...');
    
    // Initialize SDK for payment setup
    const synapse = await Synapse.create({
      privateKey: process.env.PRIVATE_KEY,
      rpcURL: RPC_URLS.calibration.http, // Start with testnet
      authorization: process.env.GLIF_TOKEN ? `Bearer ${process.env.GLIF_TOKEN}`:undefined // For higher rate limits
    });

    // Payment setup (one-time, or check if already done)
    const amount = ethers.parseUnits('2', 18); // 100 USDFC
    const pandoraAddress = CONTRACT_ADDRESSES.PANDORA_SERVICE[synapse.getNetwork()];

    // Deposit tokens
    console.log('Depositing tokens...');
    await synapse.payments.deposit(amount, TOKENS.USDFC);
    console.log('Tokens deposited successfully.');

    // Approve service
    console.log('Approving service...');
    await synapse.payments.approveService(
      pandoraAddress,
      ethers.parseUnits('0.2', 18),   // Rate allowance
      ethers.parseUnits('1', 18)  // Lockup allowance
    );
    console.log('Service approved successfully.');
    
    isPaymentSetupDone = true;
    console.log('Payment setup completed successfully.');
  } catch (error) {
    console.error('Error during payment setup:', error);
    throw error; // Re-throw to be caught by the script
  }
}

export async function initializeSynapse() {
  if (synapseInstance) {
    return synapseInstance;
  }

  try {
    // Initialize SDK
    const synapse = await Synapse.create({
      privateKey: process.env.PRIVATE_KEY,
      rpcURL: RPC_URLS.calibration.http, // Start with testnet
      withCDN: true,
      authorization: process.env.GLIF_TOKEN ? `Bearer ${process.env.GLIF_TOKEN}`:undefined // For higher rate limits
    });

    // Create storage service instance
    synapseInstance = await synapse.createStorage({
      withCDN: true,
      callbacks: {
        onProviderSelected: (provider) => {
          console.log(`✓ Selected storage provider: ${provider.owner}`)
          console.log(`  PDP URL: ${provider.pdpUrl}`)
        },
        onProofSetResolved: (info) => {
          if (info.isExisting) {
            console.log(`✓ Using existing proof set: ${info.proofSetId}`)
          } else {
            console.log(`✓ Created new proof set: ${info.proofSetId}`)
          }
        },
        onProofSetCreationStarted: (transaction, statusUrl) => {
          console.log(`  Creating proof set, tx: ${transaction.hash}`)
        },
        onProofSetCreationProgress: (progress) => {
          if (progress.transactionMined && !progress.proofSetLive) {
            console.log('  Transaction mined, waiting for proof set to be live...')
          }
        },
      },
    });
    console.log('Synapse client initialized successfully.');
    return synapse;
  } catch (error) {
    console.error('Failed to initialize Synapse client:', error);
    throw error;
  }
}

export async function getStorageService() {
  await initializeSynapse();
  // Create storage service (can be reused)
  return synapseInstance;
}