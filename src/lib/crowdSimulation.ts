interface NearbyUser {
  id: string;
  username: string;
  distance: string;
  signal: 'strong' | 'medium' | 'weak';
  method: 'bluetooth' | 'wifi';
  connected: boolean;
  ephemeralId?: string;
  lastSeen: number;
}

interface CrowdSimulationConfig {
  totalAttendees: number;
  batchSize: number;
  maxNearbyVisible: number;
  scanIntervalMs: number;
}

export class CrowdSimulation {
  private config: CrowdSimulationConfig;
  private attendeePool: NearbyUser[] = [];
  private currentBatch: NearbyUser[] = [];
  private batchIndex = 0;
  private scanActive = false;

  constructor(config: Partial<CrowdSimulationConfig> = {}) {
    this.config = {
      totalAttendees: 500000,
      batchSize: 100,
      maxNearbyVisible: 8,
      scanIntervalMs: 2000,
      ...config
    };
    this.generateAttendeePool();
  }

  private generateAttendeePool(): void {
    console.log(`Generating ${this.config.totalAttendees} mock attendees...`);
    const start = performance.now();
    
    this.attendeePool = [];
    const usernamePrefixes = ['zk_', 'crypto_', 'priv_', 'anon_', 'dev_', 'user_', 'privacy_', 'secure_'];
    const methods: ('bluetooth' | 'wifi')[] = ['bluetooth', 'wifi'];
    const signals: ('strong' | 'medium' | 'weak')[] = ['strong', 'medium', 'weak'];
    
    // Generate in chunks to avoid blocking the main thread
    for (let i = 0; i < this.config.totalAttendees; i++) {
      const id = `0x${Math.random().toString(16).substring(2, 8)}${i.toString(16).padStart(4, '0')}`;
      const prefix = usernamePrefixes[i % usernamePrefixes.length];
      const username = `${prefix}${Math.random().toString(36).substring(2, 8)}`;
      const distance = this.generateRealisticDistance();
      const signal = this.getSignalFromDistance(distance);
      const method = methods[Math.floor(Math.random() * methods.length)];
      
      this.attendeePool.push({
        id,
        username,
        distance,
        signal,
        method,
        connected: false,
        lastSeen: Date.now() - Math.random() * 60000 // Random last seen within last minute
      });
    }
    
    const end = performance.now();
    console.log(`Generated ${this.config.totalAttendees} attendees in ${(end - start).toFixed(2)}ms`);
  }

  private generateRealisticDistance(): string {
    // Weight towards closer distances
    const random = Math.random();
    let distance: number;
    
    if (random < 0.3) {
      // 30% chance of very close (1-5m)
      distance = 1 + Math.random() * 4;
    } else if (random < 0.6) {
      // 30% chance of close (5-15m)
      distance = 5 + Math.random() * 10;
    } else if (random < 0.85) {
      // 25% chance of medium (15-50m)
      distance = 15 + Math.random() * 35;
    } else {
      // 15% chance of far (50-100m)
      distance = 50 + Math.random() * 50;
    }
    
    return `${Math.round(distance)}m`;
  }

  private getSignalFromDistance(distance: string): 'strong' | 'medium' | 'weak' {
    const meters = parseInt(distance);
    if (meters <= 10) return 'strong';
    if (meters <= 30) return 'medium';
    return 'weak';
  }

  public async startScanning(
    onBatchUpdate: (users: NearbyUser[], isComplete: boolean) => void,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (this.scanActive) return;
    
    this.scanActive = true;
    this.currentBatch = [];
    this.batchIndex = 0;

    // Shuffle pool for realistic discovery
    const shuffledPool = [...this.attendeePool].sort(() => Math.random() - 0.5);
    
    const processBatch = async () => {
      if (!this.scanActive) return;
      
      const startIdx = this.batchIndex * this.config.batchSize;
      const endIdx = Math.min(startIdx + this.config.batchSize, shuffledPool.length);
      const batch = shuffledPool.slice(startIdx, endIdx);
      
      // Simulate realistic discovery - closer users found first
      const sortedBatch = batch.sort((a, b) => {
        const distanceA = parseInt(a.distance);
        const distanceB = parseInt(b.distance);
        return distanceA - distanceB;
      });
      
      // Add users gradually with some randomness
      for (let i = 0; i < sortedBatch.length && this.scanActive; i++) {
        // Skip some users randomly (realistic discovery)
        if (Math.random() > 0.7) continue;
        
        this.currentBatch.push(sortedBatch[i]);
        
        // Limit visible users
        if (this.currentBatch.length >= this.config.maxNearbyVisible) {
          break;
        }
        
        // Small delay between discoveries
        if (i % 2 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      const progress = Math.min((this.batchIndex + 1) / Math.ceil(shuffledPool.length / this.config.batchSize), 1);
      onProgress?.(progress);
      
      const isComplete = this.currentBatch.length >= this.config.maxNearbyVisible || 
                        this.batchIndex >= Math.ceil(shuffledPool.length / this.config.batchSize) - 1;
      
      onBatchUpdate([...this.currentBatch], isComplete);
      
      if (!isComplete && this.scanActive) {
        this.batchIndex++;
        setTimeout(processBatch, this.config.scanIntervalMs);
      } else {
        this.scanActive = false;
      }
    };

    await processBatch();
  }

  public stopScanning(): void {
    this.scanActive = false;
  }

  public refreshNearby(): NearbyUser[] {
    // Return a fresh random sample
    const shuffled = [...this.attendeePool].sort(() => Math.random() - 0.5);
    const nearby = shuffled
      .filter(user => parseInt(user.distance) <= 50) // Only users within 50m
      .slice(0, this.config.maxNearbyVisible);
    
    return nearby.sort((a, b) => parseInt(a.distance) - parseInt(b.distance));
  }

  public getStats() {
    return {
      totalAttendees: this.config.totalAttendees,
      batchSize: this.config.batchSize,
      maxVisible: this.config.maxNearbyVisible,
      poolGenerated: this.attendeePool.length,
      currentBatchSize: this.currentBatch.length,
      isScanning: this.scanActive
    };
  }

  public updateUserConnection(userId: string, connected: boolean, ephemeralId?: string): void {
    const user = this.currentBatch.find(u => u.id === userId);
    if (user) {
      user.connected = connected;
      if (ephemeralId) {
        user.ephemeralId = ephemeralId;
      }
    }
  }
}