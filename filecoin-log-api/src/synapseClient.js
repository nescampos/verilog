import { Synapse, RPC_URLS, TOKENS, CONTRACT_ADDRESSES } from '@filoz/synapse-sdk';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

let synapseInstance = null;

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
      //authorization: process.env.GLIF_TOKEN ? `Bearer ${process.env.GLIF_TOKEN}`:undefined // For higher rate limits
    });

    // Payment setup (one-time, or check if already done)
    const amount = ethers.parseUnits('100', 18); // 100 USDFC
    const pandoraAddress = CONTRACT_ADDRESSES.PANDORA_SERVICE[synapse.getNetwork()];
    
    // Check if deposit is needed (pseudo-code, you'd need to implement this check)
    // if (needsDeposit()) {
    //   await synapse.payments.deposit(amount, TOKENS.USDFC);
    // }
    
    // Check if approval is needed (pseudo-code)
    // if (needsApproval(pandoraAddress)) {
    //   await synapse.payments.approveService(
    //     pandoraAddress,
    //     ethers.parseUnits('10', 18),   // Rate allowance
    //     ethers.parseUnits('1000', 18)  // Lockup allowance
    //   );
    // }

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