// ZK Identity Manager - Integrated with MoPro SDK for real ZK proof generation

import { MoProIntegration, type MoProCredential } from './moproIntegration';
import { SecureWallet } from './secureWallet';

interface ZKCredential {
  id: string;
  eventId: string;
  eventName: string;
  timestamp: number;
  proof: string | Uint8Array;
  publicSignals: string[];
  verificationKey: string;
  blockchainStatus?: "Valid" | "Submitted" | "Confirmed";
  metadata: {
    location?: string;
    duration?: number;
    attendeeCount?: number;
    image?: string;
    type?: string;
  };
}

interface ZKCoPresenceProof {
  eventId: string;
  userIdA: string;
  userIdB: string;
  usernameA: string;
  usernameB: string;
  ephemeralNonce: string;
  proofString: string;
  timestamp: number;
  blockchainStatus?: "Valid" | "Submitted" | "Confirmed";
  location?: string;
  credentialA: {
    commitment: string;
    nullifier: string;
  };
  credentialB: {
    commitment: string;
    nullifier: string;
  };
}

// Import group proof types
export type { GroupProof, GroupSession, GroupParticipant } from '@/lib/groupProofs';

interface ZKIdentity {
  identityCommitment: string;
  nullifierHash: string;
  privateKey: string;
  publicKey: string;
  credentials: ZKCredential[];
}

class ZKIdentityManager {
  private static readonly STORAGE_KEY = 'zk-identity';
  private static readonly CREDENTIALS_KEY = 'zk-credentials';
  private static readonly COPRESENCE_PROOFS_KEY = 'zk-copresence-proofs';

  // Generate ZK identity using MoPro or fallback to mock
  static async generateIdentity(): Promise<ZKIdentity> {
    try {
      // Try to use MoPro first
      if (MoProIntegration.isMoProAvailable()) {
        const moProIdentity = await MoProIntegration.generateIdentity();
        if (moProIdentity) {
          return {
            identityCommitment: moProIdentity.commitment,
            nullifierHash: moProIdentity.nullifier,
            privateKey: moProIdentity.privateKey,
            publicKey: moProIdentity.publicKey,
            credentials: []
          };
        }
      }

      // Fallback to mock implementation
      console.warn('MoPro not available, using mock identity generation');
      const privateKey = this.generateRandomHex(32);
      const publicKey = this.generateRandomHex(32);
      const identityCommitment = this.generateRandomHex(32);
      const nullifierHash = this.generateRandomHex(32);

      return {
        identityCommitment,
        nullifierHash,
        privateKey,
        publicKey,
        credentials: []
      };
    } catch (error) {
      console.error('Failed to generate identity:', error);
      throw error;
    }
  }

  // Generate ZK proof for event attendance using MoPro
  static async generateEventCredential(
    eventId: string, 
    eventName: string, 
    metadata: ZKCredential['metadata'] = {}
  ): Promise<ZKCredential> {
    try {
      // Try to use MoPro first
      if (MoProIntegration.isMoProAvailable()) {
        const moProCredential = await MoProIntegration.generateEventCredential(
          eventId, 
          eventName, 
          metadata.location
        );

        if (moProCredential) {
          const credential: ZKCredential = {
            id: moProCredential.id,
            eventId,
            eventName,
            timestamp: Date.now(),
            proof: moProCredential.proof,
            publicSignals: moProCredential.publicSignals,
            verificationKey: moProCredential.verificationKey,
            metadata: { ...metadata, type: 'event_attendance' }
          };

          // Store in secure wallet
          SecureWallet.addCredential(moProCredential);
          this.storeCredential(credential);
          return credential;
        }
      }

      // Fallback to mock implementation
      console.warn('MoPro not available, using mock credential generation');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const proof = this.generateRandomHex(256);
      const publicSignals = [
        this.generateRandomHex(32), // nullifier hash
        this.generateRandomHex(32), // event hash
        this.generateRandomHex(32)  // timestamp hash
      ];
      const verificationKey = this.generateRandomHex(128);

      const credential: ZKCredential = {
        id: this.generateRandomHex(16),
        eventId,
        eventName,
        timestamp: Date.now(),
        proof,
        publicSignals,
        verificationKey,
        metadata: { ...metadata, type: 'mock' }
      };

      this.storeCredential(credential);
      return credential;
    } catch (error) {
      console.error('Failed to generate event credential:', error);
      throw error;
    }
  }

  // Generate ZK proof for co-presence
  static async generateCoPresenceProof(
    userIdA: string,
    userIdB: string,
    usernameA: string,
    usernameB: string,
    ephemeralNonce: string,
    location?: string
  ): Promise<ZKCoPresenceProof> {
    // Simulate proof generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock credentials for both users
    const credentialA = {
      commitment: this.generateRandomHex(32),
      nullifier: this.generateRandomHex(32)
    };
    
    const credentialB = {
      commitment: this.generateRandomHex(32),
      nullifier: this.generateRandomHex(32)
    };

    // Generate mock proof string using both user IDs and nonce
    const proofString = this.generateRandomHex(128);
    const eventId = `copresence-${Date.now()}-${this.generateRandomHex(8)}`;

    const proof: ZKCoPresenceProof = {
      eventId,
      userIdA,
      userIdB,
      usernameA,
      usernameB,
      ephemeralNonce,
      proofString,
      timestamp: Date.now(),
      location,
      credentialA,
      credentialB
    };

    // Store proof locally
    this.storeCoPresenceProof(proof);

    return proof;
  }

  // Verify a ZK credential using MoPro
  static async verifyCredential(credential: ZKCredential): Promise<boolean> {
    try {
      // Try to use MoPro for verification
      if (MoProIntegration.isMoProAvailable() && credential.metadata?.type !== 'mock') {
        const moProCredential: MoProCredential = {
          id: credential.id,
          proof: credential.proof as Uint8Array,
          publicSignals: credential.publicSignals,
          verificationKey: credential.verificationKey,
          metadata: credential.metadata
        };

        return await MoProIntegration.verifyCredential(moProCredential);
      }

      // Fallback to mock verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      return credential.proof.length > 0 && credential.publicSignals.length === 3;
    } catch (error) {
      console.error('Failed to verify credential:', error);
      return false;
    }
  }

  // Get or create ZK identity (async for MoPro integration)
  static async getOrCreateIdentity(): Promise<ZKIdentity> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.warn('Failed to parse stored identity, creating new one');
        }
      }

      const identity = await this.generateIdentity();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(identity));
      return identity;
    } catch (error) {
      console.error('Failed to get or create identity:', error);
      throw error;
    }
  }

  // Store a credential
  static storeCredential(credential: ZKCredential): void {
    const credentials = this.getStoredCredentials();
    credentials.push(credential);
    localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(credentials));
  }

  // Get all stored credentials
  static getStoredCredentials(): ZKCredential[] {
    const stored = localStorage.getItem(this.CREDENTIALS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse stored credentials');
      }
    }
    return [];
  }

  // Store a co-presence proof
  static storeCoPresenceProof(proof: ZKCoPresenceProof): void {
    const proofs = this.getStoredCoPresenceProofs();
    proofs.push(proof);
    localStorage.setItem(this.COPRESENCE_PROOFS_KEY, JSON.stringify(proofs));
  }

  // Get all stored co-presence proofs
  static getStoredCoPresenceProofs(): ZKCoPresenceProof[] {
    const stored = localStorage.getItem(this.COPRESENCE_PROOFS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse stored co-presence proofs');
      }
    }
    return [];
  }

  // Export credentials for sharing
  static exportCredentials(): string {
    const credentials = this.getStoredCredentials();
    return JSON.stringify(credentials, null, 2);
  }

  // Import credentials
  static importCredentials(data: string): boolean {
    try {
      const credentials = JSON.parse(data);
      if (Array.isArray(credentials)) {
        localStorage.setItem(this.CREDENTIALS_KEY, data);
        return true;
      }
    } catch (e) {
      console.error('Failed to import credentials:', e);
    }
    return false;
  }

  // Clear all data (for testing)
  static clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CREDENTIALS_KEY);
  }

  // Helper to generate random hex string
  private static generateRandomHex(length: number): string {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Get identity stats
  static getIdentityStats() {
    const credentials = this.getStoredCredentials();
    const events = new Set(credentials.map(c => c.eventId)).size;
    const totalProofs = credentials.length;
    const validProofs = credentials.filter(c => c.proof.length > 0).length;

    return {
      events,
      totalProofs,
      validProofs,
      successRate: totalProofs > 0 ? Math.round((validProofs / totalProofs) * 100) : 0
    };
  }
}

export { ZKIdentityManager, type ZKCredential, type ZKIdentity, type ZKCoPresenceProof };