// Secure Wallet for ZK Credentials
// Handles secure storage and management of ZK credentials

import { MoProIntegration, type MoProCredential, type MoProIdentity } from './moproIntegration';

interface SecureWalletData {
  identity: MoProIdentity | null;
  credentials: MoProCredential[];
  metadata: {
    created: number;
    lastAccessed: number;
    version: string;
  };
}

class SecureWallet {
  private static readonly WALLET_KEY = 'zk-secure-wallet';
  private static readonly ENCRYPTION_KEY = 'zk-wallet-encryption';

  // Initialize secure wallet
  static async initializeWallet(): Promise<SecureWalletData> {
    try {
      // Try to load existing wallet
      const existingWallet = this.loadWallet();
      if (existingWallet) {
        existingWallet.metadata.lastAccessed = Date.now();
        this.saveWallet(existingWallet);
        return existingWallet;
      }

      // Create new wallet with MoPro identity
      let identity: MoProIdentity | null = null;
      
      if (MoProIntegration.isMoProAvailable()) {
        identity = await MoProIntegration.generateIdentity();
      }

      const walletData: SecureWalletData = {
        identity,
        credentials: [],
        metadata: {
          created: Date.now(),
          lastAccessed: Date.now(),
          version: '1.0.0'
        }
      };

      this.saveWallet(walletData);
      return walletData;
    } catch (error) {
      console.error('Failed to initialize secure wallet:', error);
      throw error;
    }
  }

  // Add credential to wallet
  static addCredential(credential: MoProCredential): void {
    try {
      const wallet = this.loadWallet();
      if (!wallet) throw new Error('Wallet not initialized');

      wallet.credentials.push(credential);
      wallet.metadata.lastAccessed = Date.now();
      
      this.saveWallet(wallet);
      console.log('Credential added to secure wallet');
    } catch (error) {
      console.error('Failed to add credential to wallet:', error);
      throw error;
    }
  }

  // Get all credentials
  static getCredentials(): MoProCredential[] {
    try {
      const wallet = this.loadWallet();
      return wallet?.credentials || [];
    } catch (error) {
      console.error('Failed to get credentials from wallet:', error);
      return [];
    }
  }

  // Get credential by ID
  static getCredential(id: string): MoProCredential | null {
    try {
      const credentials = this.getCredentials();
      return credentials.find(cred => cred.id === id) || null;
    } catch (error) {
      console.error('Failed to get credential:', error);
      return null;
    }
  }

  // Get wallet identity
  static getIdentity(): MoProIdentity | null {
    try {
      const wallet = this.loadWallet();
      return wallet?.identity || null;
    } catch (error) {
      console.error('Failed to get identity from wallet:', error);
      return null;
    }
  }

  // Export wallet (encrypted)
  static exportWallet(): string {
    try {
      const wallet = this.loadWallet();
      if (!wallet) throw new Error('No wallet to export');

      // In production, this should be properly encrypted
      return JSON.stringify(wallet, null, 2);
    } catch (error) {
      console.error('Failed to export wallet:', error);
      throw error;
    }
  }

  // Import wallet
  static importWallet(walletData: string): boolean {
    try {
      const parsed = JSON.parse(walletData) as SecureWalletData;
      
      // Validate wallet structure
      if (!parsed.metadata || !Array.isArray(parsed.credentials)) {
        throw new Error('Invalid wallet format');
      }

      parsed.metadata.lastAccessed = Date.now();
      this.saveWallet(parsed);
      
      console.log('Wallet imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import wallet:', error);
      return false;
    }
  }

  // Clear wallet data
  static clearWallet(): void {
    try {
      localStorage.removeItem(this.WALLET_KEY);
      console.log('Wallet cleared');
    } catch (error) {
      console.error('Failed to clear wallet:', error);
    }
  }

  // Get wallet statistics
  static getWalletStats() {
    try {
      const wallet = this.loadWallet();
      if (!wallet) return null;

      const credentialTypes = new Set(
        wallet.credentials.map(cred => cred.metadata?.type || 'unknown')
      );

      return {
        totalCredentials: wallet.credentials.length,
        credentialTypes: Array.from(credentialTypes),
        created: wallet.metadata.created,
        lastAccessed: wallet.metadata.lastAccessed,
        hasIdentity: !!wallet.identity,
        moProAvailable: MoProIntegration.isMoProAvailable()
      };
    } catch (error) {
      console.error('Failed to get wallet stats:', error);
      return null;
    }
  }

  // Private methods for wallet management
  private static loadWallet(): SecureWalletData | null {
    try {
      const data = localStorage.getItem(this.WALLET_KEY);
      if (!data) return null;

      // In production, decrypt the data here
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load wallet:', error);
      return null;
    }
  }

  private static saveWallet(wallet: SecureWalletData): void {
    try {
      // In production, encrypt the data here
      localStorage.setItem(this.WALLET_KEY, JSON.stringify(wallet));
    } catch (error) {
      console.error('Failed to save wallet:', error);
      throw error;
    }
  }
}

export { SecureWallet, type SecureWalletData };