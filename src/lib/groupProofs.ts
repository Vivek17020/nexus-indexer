// Group Proof Management for Multi-User Sessions

export interface GroupParticipant {
  userId: string;
  username: string;
  commitment: string;
  nullifier: string;
  joinedAt: number;
  isHost: boolean;
}

export interface GroupSession {
  sessionId: string;
  eventId: string;
  eventName: string;
  hostUserId: string;
  participants: GroupParticipant[];
  maxParticipants: number;
  minParticipants: number;
  status: 'waiting' | 'active' | 'completed' | 'expired';
  createdAt: number;
  expiresAt: number;
  location?: string;
  sessionKey: string;
}

export interface GroupProof {
  id: string;
  sessionId: string;
  eventId: string;
  eventName: string;
  participants: GroupParticipant[];
  proof: string;
  merkleRoot: string;
  timestamp: number;
  blockchainStatus?: "Valid" | "Submitted" | "Confirmed";
  metadata: {
    location?: string;
    sessionDuration: number;
    participantCount: number;
  };
}

export class GroupProofManager {
  private static readonly SESSION_STORAGE_KEY = 'group-sessions';
  private static readonly GROUP_PROOFS_KEY = 'group-proofs';
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  static generateSessionId(): string {
    return 'grp_' + this.generateRandomHex(16);
  }

  static generateSessionKey(): string {
    return this.generateRandomHex(32);
  }

  static createSession(
    eventId: string,
    eventName: string,
    hostUserId: string,
    hostUsername: string,
    maxParticipants: number = 10,
    minParticipants: number = 3,
    location?: string
  ): GroupSession {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    const hostParticipant: GroupParticipant = {
      userId: hostUserId,
      username: hostUsername,
      commitment: this.generateRandomHex(32),
      nullifier: this.generateRandomHex(32),
      joinedAt: now,
      isHost: true
    };

    const session: GroupSession = {
      sessionId,
      eventId,
      eventName,
      hostUserId,
      participants: [hostParticipant],
      maxParticipants,
      minParticipants,
      status: 'waiting',
      createdAt: now,
      expiresAt: now + this.SESSION_TIMEOUT,
      location,
      sessionKey: this.generateSessionKey()
    };

    this.storeSession(session);
    return session;
  }

  static joinSession(
    sessionId: string,
    userId: string,
    username: string,
    sessionKey?: string
  ): GroupSession | null {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'waiting' && session.status !== 'active') {
      throw new Error('Session is no longer accepting participants');
    }

    if (session.participants.length >= session.maxParticipants) {
      throw new Error('Session is full');
    }

    if (Date.now() > session.expiresAt) {
      session.status = 'expired';
      this.storeSession(session);
      throw new Error('Session has expired');
    }

    // Check if user is already in session
    if (session.participants.find(p => p.userId === userId)) {
      return session; // Already joined
    }

    // Verify session key if provided
    if (sessionKey && sessionKey !== session.sessionKey) {
      throw new Error('Invalid session key');
    }

    const participant: GroupParticipant = {
      userId,
      username,
      commitment: this.generateRandomHex(32),
      nullifier: this.generateRandomHex(32),
      joinedAt: Date.now(),
      isHost: false
    };

    session.participants.push(participant);
    
    // Update session status
    if (session.participants.length >= session.minParticipants) {
      session.status = 'active';
    }

    this.storeSession(session);
    return session;
  }

  static generateGroupProof(session: GroupSession): GroupProof {
    if (session.participants.length < session.minParticipants) {
      throw new Error(`Minimum ${session.minParticipants} participants required`);
    }

    // Generate Merkle root from all participant commitments
    const commitments = session.participants.map(p => p.commitment);
    const merkleRoot = this.generateMerkleRoot(commitments);
    
    // Generate group proof
    const proofString = this.generateGroupProofString(session, merkleRoot);
    
    const groupProof: GroupProof = {
      id: 'gproof_' + this.generateRandomHex(16),
      sessionId: session.sessionId,
      eventId: session.eventId,
      eventName: session.eventName,
      participants: [...session.participants],
      proof: proofString,
      merkleRoot,
      timestamp: Date.now(),
      metadata: {
        location: session.location,
        sessionDuration: Date.now() - session.createdAt,
        participantCount: session.participants.length
      }
    };

    // Mark session as completed
    session.status = 'completed';
    this.storeSession(session);

    // Store group proof
    this.storeGroupProof(groupProof);
    
    return groupProof;
  }

  private static generateMerkleRoot(commitments: string[]): string {
    // Simple mock Merkle root generation
    // In real implementation, this would be a proper Merkle tree
    const combined = commitments.sort().join('');
    return 'merkle_' + this.hashString(combined);
  }

  private static generateGroupProofString(session: GroupSession, merkleRoot: string): string {
    const proofData = {
      sessionId: session.sessionId,
      eventId: session.eventId,
      merkleRoot,
      participantCount: session.participants.length,
      timestamp: Date.now()
    };
    
    return 'group_proof_' + this.hashString(JSON.stringify(proofData));
  }

  private static hashString(input: string): string {
    // Simple hash function for demo purposes
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  static getSession(sessionId: string): GroupSession | null {
    const sessions = this.getStoredSessions();
    return sessions.find(s => s.sessionId === sessionId) || null;
  }

  static getUserSessions(userId: string): GroupSession[] {
    const sessions = this.getStoredSessions();
    return sessions.filter(s => 
      s.participants.some(p => p.userId === userId) && 
      s.status !== 'expired'
    );
  }

  static getActiveSessionsForEvent(eventId: string): GroupSession[] {
    const sessions = this.getStoredSessions();
    return sessions.filter(s => 
      s.eventId === eventId && 
      (s.status === 'waiting' || s.status === 'active') &&
      Date.now() < s.expiresAt
    );
  }

  static storeSession(session: GroupSession): void {
    const sessions = this.getStoredSessions();
    const index = sessions.findIndex(s => s.sessionId === session.sessionId);
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    
    localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessions));
  }

  static getStoredSessions(): GroupSession[] {
    try {
      const stored = localStorage.getItem(this.SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static storeGroupProof(proof: GroupProof): void {
    const proofs = this.getStoredGroupProofs();
    proofs.push(proof);
    localStorage.setItem(this.GROUP_PROOFS_KEY, JSON.stringify(proofs));
  }

  static getStoredGroupProofs(): GroupProof[] {
    try {
      const stored = localStorage.getItem(this.GROUP_PROOFS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static generateQRData(session: GroupSession): string {
    return JSON.stringify({
      type: 'group_session',
      sessionId: session.sessionId,
      eventId: session.eventId,
      eventName: session.eventName,
      sessionKey: session.sessionKey,
      hostUsername: session.participants.find(p => p.isHost)?.username || 'Unknown',
      participantCount: session.participants.length,
      maxParticipants: session.maxParticipants,
      expiresAt: session.expiresAt
    });
  }

  static parseQRData(qrData: string): any {
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.type === 'group_session') {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  static cleanupExpiredSessions(): void {
    const sessions = this.getStoredSessions();
    const now = Date.now();
    const activeSessions = sessions.filter(s => {
      if (now > s.expiresAt && s.status !== 'completed') {
        s.status = 'expired';
      }
      return s.status !== 'expired' || (now - s.expiresAt) < 24 * 60 * 60 * 1000; // Keep for 24h
    });
    
    localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(activeSessions));
  }

  private static generateRandomHex(length: number): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
}