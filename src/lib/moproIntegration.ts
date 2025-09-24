// MoPro SDK Integration
// This module handles the integration with MoPro SDK for ZK proof generation

interface MoProCredential {
  id: string;
  proof: Uint8Array;
  publicSignals: string[];
  verificationKey: string;
  metadata: any;
}

interface MoProIdentity {
  commitment: string;
  nullifier: string;
  privateKey: string;
  publicKey: string;
}

class MoProIntegration {
  private static instance: any = null;
  private static isInitialized = false;

  // Check if MoPro is available
  static isMoProAvailable(): boolean {
    try {
      // Try to detect MoPro SDK
      return typeof window !== 'undefined' && 
             (window as any).mopro !== undefined;
    } catch (error) {
      return false;
    }
  }

  // Initialize MoPro SDK
  static async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (!this.isMoProAvailable()) {
        console.warn('MoPro SDK not available, falling back to mock implementation');
        return false;
      }

      // Initialize MoPro SDK
      const mopro = (window as any).mopro;
      this.instance = await mopro.initialize();
      this.isInitialized = true;
      
      console.log('MoPro SDK initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MoPro SDK:', error);
      return false;
    }
  }

  // Generate ZK identity using MoPro
  static async generateIdentity(): Promise<MoProIdentity | null> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) return null;
      }

      // Use MoPro to generate identity
      const identity = await this.instance.generateIdentity();
      
      return {
        commitment: identity.commitment,
        nullifier: identity.nullifier,
        privateKey: identity.privateKey,
        publicKey: identity.publicKey
      };
    } catch (error) {
      console.error('Failed to generate MoPro identity:', error);
      return null;
    }
  }

  // Generate age credential using MoPro
  static async generateAgeCredential(age: number, minAge: number = 18): Promise<MoProCredential | null> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) return null;
      }

      // Generate age proof circuit
      const proof = await this.instance.generateProof('age_verification', {
        age: age,
        min_age: minAge,
        timestamp: Date.now()
      });

      return {
        id: this.generateId(),
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        verificationKey: proof.verificationKey,
        metadata: {
          type: 'age_verification',
          minAge: minAge,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Failed to generate age credential:', error);
      return null;
    }
  }

  // Generate uniqueness credential using MoPro
  static async generateUniquenessCredential(userSecret: string): Promise<MoProCredential | null> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) return null;
      }

      // Generate uniqueness proof
      const proof = await this.instance.generateProof('uniqueness', {
        secret: userSecret,
        timestamp: Date.now()
      });

      return {
        id: this.generateId(),
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        verificationKey: proof.verificationKey,
        metadata: {
          type: 'uniqueness',
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Failed to generate uniqueness credential:', error);
      return null;
    }
  }

  // Generate event attendance credential using MoPro
  static async generateEventCredential(
    eventId: string, 
    eventName: string, 
    location?: string
  ): Promise<MoProCredential | null> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) return null;
      }

      // Generate event attendance proof
      const proof = await this.instance.generateProof('event_attendance', {
        event_id: eventId,
        event_name: eventName,
        location: location || '',
        timestamp: Date.now()
      });

      return {
        id: this.generateId(),
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        verificationKey: proof.verificationKey,
        metadata: {
          type: 'event_attendance',
          eventId,
          eventName,
          location,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Failed to generate event credential:', error);
      return null;
    }
  }

  // Verify credential using MoPro
  static async verifyCredential(credential: MoProCredential): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) return false;
      }

      // Verify proof using MoPro
      const isValid = await this.instance.verifyProof(
        credential.proof,
        credential.publicSignals,
        credential.verificationKey
      );

      return isValid;
    } catch (error) {
      console.error('Failed to verify credential:', error);
      return false;
    }
  }

  // Generate secure random ID
  private static generateId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Get MoPro status
  static getStatus() {
    return {
      available: this.isMoProAvailable(),
      initialized: this.isInitialized,
      version: this.instance?.version || 'unknown'
    };
  }
}

export { MoProIntegration, type MoProCredential, type MoProIdentity };