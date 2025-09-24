import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, MapPin, QrCode } from 'lucide-react';

interface GroupSessionScannerProps {
  onSessionJoined: (qrData: string) => void;
  onCancel: () => void;
  isJoining: boolean;
}

interface SessionInfo {
  eventName: string;
  hostUsername: string;
  participantCount: number;
  maxParticipants: number;
  expiresAt: number;
}

export function GroupSessionScanner({
  onSessionJoined,
  onCancel,
  isJoining
}: GroupSessionScannerProps) {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [qrData, setQrData] = useState<string>('');

  const handleQRScan = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'group_session') {
        setQrData(data);
        setSessionInfo({
          eventName: parsed.eventName,
          hostUsername: parsed.hostUsername,
          participantCount: parsed.participantCount,
          maxParticipants: parsed.maxParticipants,
          expiresAt: parsed.expiresAt
        });
      }
    } catch (error) {
      console.error('Invalid QR code:', error);
    }
  };

  const handleJoin = () => {
    if (qrData) {
      onSessionJoined(qrData);
    }
  };

  const timeUntilExpiry = sessionInfo ? Math.max(0, sessionInfo.expiresAt - Date.now()) : 0;
  const minutesLeft = Math.floor(timeUntilExpiry / (1000 * 60));

  return (
    <div className="space-y-4">
      {!sessionInfo ? (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Scan Group Session
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Scan QR code to join a group verification session
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="aspect-square w-full max-w-64 mx-auto border-2 border-dashed border-border rounded-lg overflow-hidden">
              <QRCodeScanner 
                onClose={() => {}}
                onProofGenerated={() => {}}
              />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Point your camera at the group session QR code
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Join Group Session
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Event Info */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-lg border border-primary/20">
              <h3 className="font-semibold text-lg mb-2">{sessionInfo.eventName}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Host:</span>
                  <span className="font-medium">{sessionInfo.hostUsername}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Participants:</span>
                  <Badge variant="secondary">
                    {sessionInfo.participantCount}/{sessionInfo.maxParticipants}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Expires in:
                  </span>
                  <span className={`font-medium ${minutesLeft < 5 ? 'text-destructive' : 'text-foreground'}`}>
                    {minutesLeft}m
                  </span>
                </div>
              </div>
            </div>

            {/* Status Checks */}
            <div className="space-y-2">
              {timeUntilExpiry <= 0 && (
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ This session has expired
                  </p>
                </div>
              )}
              
              {sessionInfo.participantCount >= sessionInfo.maxParticipants && (
                <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg">
                  <p className="text-sm text-warning font-medium">
                    ⚠️ This session is full
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isJoining}
              >
                Cancel
              </Button>
              <Button
                onClick={handleJoin}
                className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                disabled={
                  isJoining || 
                  timeUntilExpiry <= 0 || 
                  sessionInfo.participantCount >= sessionInfo.maxParticipants
                }
              >
                {isJoining ? 'Joining...' : 'Join Session'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}