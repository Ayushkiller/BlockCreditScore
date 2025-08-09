// Cryptographic utility functions

import { keccak256, toUtf8Bytes, isAddress } from 'ethers';

/**
 * Validates if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return isAddress(address);
}

/**
 * Normalizes an Ethereum address to lowercase
 */
export function normalizeAddress(address: string): string {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
  return address.toLowerCase();
}

/**
 * Generates a deterministic hash from multiple inputs
 */
export function generateHash(...inputs: string[]): string {
  const combined = inputs.join('');
  return keccak256(toUtf8Bytes(combined));
}

/**
 * Creates a unique identifier for a user's credit profile
 */
export function generateCreditProfileId(userAddress: string, timestamp: number): string {
  return generateHash(normalizeAddress(userAddress), timestamp.toString());
}

/**
 * Creates a unique identifier for a transaction
 */
export function generateTransactionId(
  txHash: string, 
  chainId: number, 
  blockNumber: number
): string {
  return generateHash(txHash, chainId.toString(), blockNumber.toString());
}

/**
 * Validates a signature format
 */
export function isValidSignature(signature: string): boolean {
  return /^0x[a-fA-F0-9]{130}$/.test(signature);
}

/**
 * Generates a random nonce for cryptographic operations
 */
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Creates a deterministic seed for ML model training
 */
export function generateModelSeed(modelId: string, version: string): number {
  const hash = generateHash(modelId, version);
  // Convert first 8 characters of hash to number
  return parseInt(hash.substring(2, 10), 16);
}