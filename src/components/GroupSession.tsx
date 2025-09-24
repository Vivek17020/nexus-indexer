import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import QRCode from 'qrcode';
import { GroupSessionCreator } from '@/components/GroupSessionCreator';
import { GroupSessionScanner } from '@/components/GroupSessionScanner';
import { useGroupSession } from '@/hooks/useGroupSession';
import { 
  Users, 
  Clock, 
  MapPin, 
  Crown, 
  UserPlus, 
  QrCode, 
  Zap,
  RefreshCw,
  LogOut,
  Copy,
  CheckCircle2
} from 'lucide-react';

interface GroupSessionProps {
  eventId?: string;
  eventName?: string;
  onGroupProofGenerated?: (proof: any) => void;
}

type ViewMode = 'list' | 'create' | 'scan' | 'active';

export function GroupSession({
  eventId,
  eventName,
  onGroupProofGenerated
}: GroupSessionProps) {
  const {
    currentSession,
    userSessions,
    groupProofs,
    currentUser,
    isCreatingSession,
    isJoiningSession,
    isGeneratingProof,
    createSession,
    joinFromQRData,
    generateGroupProof,
    leaveSession,
    refreshSession,
    getQRData
  } = useGroupSession();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Update countdown timer
  useEffect(() => {
    if (currentSession) {
      const updateTimer = () => {
        const remaining = Math.max(0, currentSession.expiresAt - Date.now());
        setTimeLeft(remaining);
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [currentSession]);

  // Auto-refresh session
  useEffect(() => {
    if (currentSession) {
      const interval = setInterval(refreshSession, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [currentSession, refreshSession]);

  // Set active view when session exists
  useEffect(() => {
    if (currentSession && viewMode !== 'active') {
      setViewMode('active');
    } else if (!currentSession && viewMode === 'active') {
      setViewMode('list');
    }
  }, [currentSession, viewMode]);

  const isHost = currentSession?.hostUserId === currentUser.id;

  // Generate QR code when session is available
  useEffect(() => {
    if (currentSession && isHost) {
      const generateQR = async () => {
        try {
          const qrData = getQRData(currentSession);
          const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'M',
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
            width: 200
          });
          setQrCodeUrl(qrCodeDataUrl);
        } catch (error) {
          console.error('Failed to generate QR code:', error);
        }
      };
      generateQR();
    }
  }, [currentSession, isHost, getQRData]);

  const handleCreateSession = async () => {
    if (!eventId || !eventName) return;
    
    const session = await createSession(eventId, eventName);
    if (session) {
      setViewMode('active');
    }
  };

  const handleJoinSession = async (qrData: string) => {
    const session = await joinFromQRData(qrData);
    if (session) {
      setViewMode('active');
    }
  };

  const handleGenerateProof = async () => {
    const proof = await generateGroupProof();
    if (proof && onGroupProofGenerated) {
      onGroupProofGenerated(proof);
    }
  };

  const copySessionId = async () => {
    if (currentSession) {
      await navigator.clipboard.writeText(currentSession.sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTimeLeft = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const canGenerateProof = currentSession && 
    currentSession.participants.length >= currentSession.minParticipants &&
    (isHost || currentSession.status === 'active');

  // List/Overview Mode
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Group Verification</h2>
          <p className="text-muted-foreground">
            Create or join group sessions for multi-user proof generation
          </p>
        </div>

        {/* Action Buttons */}
        {eventId && eventName && (
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => setViewMode('create')}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              disabled={isCreatingSession}
            >
              <Users className="w-4 h-4" />
              Create Session
            </Button>
            <Button
              onClick={() => setViewMode('scan')}
              variant="outline"
              className="flex items-center gap-2 border-primary/30 hover:bg-primary/10"
              disabled={isJoiningSession}
            >
              <QrCode className="w-4 h-4" />
              Join Session
            </Button>
          </div>
        )}

        {/* Group Proofs */}
        {groupProofs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Group Proofs</h3>
            {groupProofs.map((proof) => (
              <Card key={proof.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{proof.eventName}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {proof.participants.length} participants
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(proof.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={proof.blockchainStatus === 'Submitted' ? 'bg-success text-success-foreground' : ''}
                    >
                      {proof.blockchainStatus || 'Valid'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Create Session Mode
  if (viewMode === 'create') {
    return (
      <GroupSessionCreator
        eventId={eventId!}
        eventName={eventName!}
        onSessionCreated={handleCreateSession}
        onCancel={() => setViewMode('list')}
        isCreating={isCreatingSession}
      />
    );
  }

  // Scan/Join Mode
  if (viewMode === 'scan') {
    return (
      <GroupSessionScanner
        onSessionJoined={handleJoinSession}
        onCancel={() => setViewMode('list')}
        isJoining={isJoiningSession}
      />
    );
  }

  // Active Session Mode
  if (viewMode === 'active' && currentSession) {
    return (
      <div className="space-y-6">
        {/* Session Header */}
        <Card className="shadow-card border-l-4 border-l-primary">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {currentSession.eventName}
                  {isHost && <Crown className="w-4 h-4 text-warning" />}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeLeft(timeLeft)}
                  </div>
                  {currentSession.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {currentSession.location}
                    </div>
                  )}
                </div>
              </div>
              <Badge
                variant={currentSession.status === 'active' ? 'default' : 'secondary'}
                className={currentSession.status === 'active' ? 'bg-success text-success-foreground' : ''}
              >
                {currentSession.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Session ID */}
            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/50">
              <div>
                <p className="text-sm font-medium">Session ID</p>
                <code className="text-xs font-mono text-muted-foreground">
                  {currentSession.sessionId}
                </code>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={copySessionId}
                className="h-8"
              >
                {copied ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={refreshSession}
                className="flex-1"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={leaveSession}
                className="flex-1 hover:bg-destructive/10 hover:border-destructive/30"
              >
                <LogOut className="w-3 h-3 mr-1" />
                {isHost ? 'End Session' : 'Leave'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code for Sharing */}
        {isHost && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Share Session</CardTitle>
              <p className="text-sm text-muted-foreground">
                Others can scan this QR code to join
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                {qrCodeUrl ? (
                  <div className="p-4 bg-white rounded-lg">
                    <img 
                      src={qrCodeUrl} 
                      alt="Group session QR code"
                      className="w-48 h-48"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Generating QR...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Participants */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Participants ({currentSession.participants.length}/{currentSession.maxParticipants})</span>
              <Badge variant="outline">
                Min: {currentSession.minParticipants}
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {currentSession.participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{participant.username}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(participant.joinedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {participant.isHost && (
                      <Crown className="w-4 h-4 text-warning" />
                    )}
                    {participant.userId === currentUser.id && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Generate Proof */}
        {canGenerateProof && (
          <Card className="shadow-card border-primary/20">
            <CardContent className="p-4">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Ready to Generate Proof!</h3>
                  <p className="text-sm text-muted-foreground">
                    All participants are ready. Generate the group ZK proof.
                  </p>
                </div>
                
                <Button
                  onClick={handleGenerateProof}
                  disabled={isGeneratingProof}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {isGeneratingProof ? 'Generating Proof...' : 'Generate Group Proof'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waiting Message */}
        {!canGenerateProof && currentSession.participants.length < currentSession.minParticipants && (
          <Card className="shadow-card border-warning/20">
            <CardContent className="p-4 text-center">
              <UserPlus className="w-8 h-8 text-warning mx-auto mb-2" />
              <h3 className="font-semibold">Waiting for More Participants</h3>
              <p className="text-sm text-muted-foreground">
                Need {currentSession.minParticipants - currentSession.participants.length} more participants to generate proof
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
}