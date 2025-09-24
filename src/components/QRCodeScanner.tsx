import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useZKIdentity } from '@/hooks/useZKIdentity';
import { Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeScannerProps {
  onClose?: () => void;
  onProofGenerated?: () => void;
}

interface QRData {
  type: string;
  userId: string;
  ephemeralId: string;
  timestamp: number;
  username: string;
}

export function QRCodeScanner({ onClose, onProofGenerated }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { identity, generateCoPresenceProof } = useZKIdentity();
  const { toast } = useToast();

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      const qrScanner = new QrScanner(
        videoRef.current,
        async (result) => {
          try {
            const qrData: QRData = JSON.parse(result.data);
            
            if (qrData.type === 'zk-proximity' && qrData.userId !== identity?.identityCommitment) {
              // Generate co-presence proof
              await generateCoPresenceProof(
                identity?.identityCommitment || 'anonymous',
                qrData.userId,
                `User-${identity?.identityCommitment?.slice(0, 8) || 'anon'}`,
                qrData.username,
                qrData.ephemeralId,
                'QR Code Scan'
              );
              
              toast({
                title: "QR Code Scanned! 📱",
                description: `Co-presence proof generated with ${qrData.username}`,
              });
              
              qrScanner.stop();
              setIsScanning(false);
              onProofGenerated?.();
              onClose?.();
            } else if (qrData.userId === identity?.identityCommitment) {
              toast({
                variant: "destructive",
                title: "Cannot scan your own QR code",
                description: "Please scan someone else's QR code to generate a proof.",
              });
            } else {
              toast({
                variant: "destructive",
                title: "Invalid QR Code",
                description: "This QR code is not for proximity proof generation.",
              });
            }
          } catch (error) {
            toast({
              variant: "destructive",
              title: "Invalid QR Code",
              description: "Unable to parse QR code data.",
            });
          }
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      setScanner(qrScanner);
      await qrScanner.start();
      setIsScanning(true);
      setHasPermission(true);
    } catch (error) {
      console.error('Error starting scanner:', error);
      setHasPermission(false);
      toast({
        variant: "destructive",
        title: "Camera Access Denied",
        description: "Please allow camera access to scan QR codes.",
      });
    }
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.stop();
      scanner.destroy();
      setScanner(null);
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Scan QR Code</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Point your camera at another user's QR code
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
          {!isScanning && hasPermission !== false && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button onClick={startScanning}>
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            </div>
          )}
          
          {hasPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <Camera className="w-8 h-8 mb-2 text-muted-foreground" />
              <p className="text-sm text-center text-muted-foreground">
                Camera access is required to scan QR codes
              </p>
              <Button onClick={startScanning} className="mt-2">
                Try Again
              </Button>
            </div>
          )}
          
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ display: isScanning ? 'block' : 'none' }}
          />
        </div>

        <div className="flex gap-2">
          {isScanning && (
            <Button
              variant="outline"
              onClick={stopScanning}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Stop Camera
            </Button>
          )}
          {onClose && (
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}