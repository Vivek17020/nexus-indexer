import { useState, useEffect, useCallback } from 'react';
import { GroupProofManager, type GroupSession, type GroupProof, type GroupParticipant } from '@/lib/groupProofs';
import { useToast } from '@/hooks/use-toast';

export function useGroupSession() {
  const [currentSession, setCurrentSession] = useState<GroupSession | null>(null);
  const [userSessions, setUserSessions] = useState<GroupSession[]>([]);
  const [groupProofs, setGroupProofs] = useState<GroupProof[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const { toast } = useToast();

  // Mock user data - in real app this would come from auth
  const currentUser = {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    username: 'User' + Math.random().toString(36).substr(2, 4)
  };

  useEffect(() => {
    // Load existing data
    loadUserData();
    
    // Cleanup expired sessions
    GroupProofManager.cleanupExpiredSessions();
    
    // Set up periodic cleanup
    const cleanup = setInterval(() => {
      GroupProofManager.cleanupExpiredSessions();
    }, 60000); // Every minute

    return () => clearInterval(cleanup);
  }, []);

  const loadUserData = useCallback(() => {
    const sessions = GroupProofManager.getUserSessions(currentUser.id);
    const proofs = GroupProofManager.getStoredGroupProofs();
    
    setUserSessions(sessions);
    setGroupProofs(proofs);
    
    // Set current session if user has an active one
    const activeSession = sessions.find(s => 
      (s.status === 'waiting' || s.status === 'active') && 
      Date.now() < s.expiresAt
    );
    setCurrentSession(activeSession || null);
  }, [currentUser.id]);

  const createSession = async (
    eventId: string,
    eventName: string,
    maxParticipants: number = 10,
    minParticipants: number = 3,
    location?: string
  ) => {
    if (isCreatingSession) return null;
    
    setIsCreatingSession(true);
    
    try {
      const session = GroupProofManager.createSession(
        eventId,
        eventName,
        currentUser.id,
        currentUser.username,
        maxParticipants,
        minParticipants,
        location
      );
      
      setCurrentSession(session);
      loadUserData();
      
      toast({
        title: "Group Session Created! 👥",
        description: `Share the QR code for others to join ${eventName}`,
      });
      
      return session;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Create Session",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  };

  const joinSession = async (sessionId: string, sessionKey?: string) => {
    if (isJoiningSession) return null;
    
    setIsJoiningSession(true);
    
    try {
      const session = GroupProofManager.joinSession(
        sessionId,
        currentUser.id,
        currentUser.username,
        sessionKey
      );
      
      if (session) {
        setCurrentSession(session);
        loadUserData();
        
        toast({
          title: "Joined Group Session! 🎉",
          description: `You're now part of ${session.eventName} group`,
        });
      }
      
      return session;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Join Session",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      return null;
    } finally {
      setIsJoiningSession(false);
    }
  };

  const joinFromQRData = async (qrData: string) => {
    const sessionData = GroupProofManager.parseQRData(qrData);
    
    if (!sessionData) {
      toast({
        variant: "destructive",
        title: "Invalid QR Code",
        description: "This QR code is not a valid group session",
      });
      return null;
    }
    
    if (Date.now() > sessionData.expiresAt) {
      toast({
        variant: "destructive",
        title: "Session Expired",
        description: "This group session has expired",
      });
      return null;
    }
    
    return joinSession(sessionData.sessionId, sessionData.sessionKey);
  };

  const generateGroupProof = async () => {
    if (!currentSession || isGeneratingProof) return null;
    
    if (currentSession.participants.length < currentSession.minParticipants) {
      toast({
        variant: "destructive",
        title: "Not Enough Participants",
        description: `Need at least ${currentSession.minParticipants} participants to generate proof`,
      });
      return null;
    }
    
    setIsGeneratingProof(true);
    
    try {
      toast({
        title: "Generating Group Proof",
        description: "Creating ZK proof for all participants...",
      });
      
      const groupProof = GroupProofManager.generateGroupProof(currentSession);
      
      setGroupProofs(prev => [...prev, groupProof]);
      setCurrentSession(null); // Session completed
      loadUserData();
      
      toast({
        title: "Group Proof Generated! 🎉",
        description: `Successfully created proof for ${groupProof.participants.length} participants`,
      });
      
      // Trigger confetti
      if (typeof window !== 'undefined') {
        import('canvas-confetti').then(confetti => {
          confetti.default({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B']
          });
        });
      }
      
      return groupProof;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Proof Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      return null;
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const leaveSession = () => {
    if (!currentSession) return;
    
    if (currentSession.hostUserId === currentUser.id) {
      // Host leaving - end session for everyone
      currentSession.status = 'expired';
      GroupProofManager.storeSession(currentSession);
      
      toast({
        title: "Session Ended",
        description: "You ended the group session as the host",
      });
    } else {
      // Remove participant from session
      currentSession.participants = currentSession.participants.filter(
        p => p.userId !== currentUser.id
      );
      GroupProofManager.storeSession(currentSession);
      
      toast({
        title: "Left Session",
        description: "You left the group session",
      });
    }
    
    setCurrentSession(null);
    loadUserData();
  };

  const refreshSession = () => {
    if (currentSession) {
      const updated = GroupProofManager.getSession(currentSession.sessionId);
      if (updated && updated.status !== 'expired') {
        setCurrentSession(updated);
      } else {
        setCurrentSession(null);
      }
    }
    loadUserData();
  };

  const getQRData = (session: GroupSession) => {
    return GroupProofManager.generateQRData(session);
  };

  const getActiveSessionsForEvent = (eventId: string) => {
    return GroupProofManager.getActiveSessionsForEvent(eventId);
  };

  return {
    // State
    currentSession,
    userSessions,
    groupProofs,
    currentUser,
    isCreatingSession,
    isJoiningSession,
    isGeneratingProof,
    
    // Actions
    createSession,
    joinSession,
    joinFromQRData,
    generateGroupProof,
    leaveSession,
    refreshSession,
    getQRData,
    getActiveSessionsForEvent,
    loadUserData
  };
}