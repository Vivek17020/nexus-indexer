import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useZKIdentity } from '@/hooks/useZKIdentity';
import { RefreshCw, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeGeneratorProps {
  onClose?: () => void;
}

export function QRCodeGenerator({ onClose }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [ephemeralId, setEphemeralId] = useState<string>('');
  const { identity } = useZKIdentity();
  const { toast } = useToast();

  const generateEphemeralId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const generateQRCode = async () => {
    const newEphemeralId = generateEphemeralId();
    setEphemeralId(newEphemeralId);
    
    const qrData = {
      type: 'zk-proximity',
      userId: identity?.identityCommitment || 'anonymous',
      ephemeralId: newEphemeralId,
      timestamp: Date.now(),
      username: `User-${identity?.identityCommitment?.slice(0, 8) || 'anon'}`
    };

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "QR Code Generation Failed",
        description: "Failed to generate QR code. Please try again.",
      });
    }
  };

  const copyEphemeralId = () => {
    navigator.clipboard.writeText(ephemeralId);
    toast({
      title: "Copied!",
      description: "Ephemeral ID copied to clipboard",
    });
  };

  useEffect(() => {
    generateQRCode();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Share Your QR Code</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Let others scan this to generate a co-presence proof
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          {qrCodeUrl && (
            <img 
              src={qrCodeUrl} 
              alt="QR Code for proximity proof" 
              className="border rounded-lg"
            />
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Ephemeral ID:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted p-2 rounded text-xs break-all">
              {ephemeralId}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyEphemeralId}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={generateQRCode}
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {onClose && (
            <Button onClick={onClose} className="flex-1">
              Done
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}