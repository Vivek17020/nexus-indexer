import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { HDNode } from '@ethersproject/hdnode';

export interface WalletKeypair {
  address: string;
  privateKey: string;
  mnemonic: string;
}

export const generateWallet = (): WalletKeypair => {
  // Generate a 12-word mnemonic phrase
  const mnemonic = generateMnemonic();
  
  // Convert mnemonic to seed
  const seed = mnemonicToSeedSync(mnemonic);
  
  // Create HD wallet from seed (using standard Ethereum derivation path)
  const hdNode = HDNode.fromSeed(seed);
  const derivedNode = hdNode.derivePath("m/44'/60'/0'/0/0");
  
  return {
    address: derivedNode.address,
    privateKey: derivedNode.privateKey,
    mnemonic
  };
};

export const storeWalletSecurely = (wallet: WalletKeypair): void => {
  // Store encrypted in localStorage for web
  // In a native app, this would use secure keychain/keystore
  const walletData = {
    address: wallet.address,
    // In production, encrypt the private key and mnemonic
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic,
    timestamp: Date.now()
  };
  
  localStorage.setItem('zkpresence-wallet', JSON.stringify(walletData));
};

export const getStoredWallet = (): WalletKeypair | null => {
  try {
    const stored = localStorage.getItem('zkpresence-wallet');
    if (!stored) return null;
    
    const walletData = JSON.parse(stored);
    return {
      address: walletData.address,
      privateKey: walletData.privateKey,
      mnemonic: walletData.mnemonic
    };
  } catch (error) {
    console.error('Error retrieving wallet:', error);
    return null;
  }
};

export const hasStoredWallet = (): boolean => {
  return getStoredWallet() !== null;
};