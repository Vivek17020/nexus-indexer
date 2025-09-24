import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Calendar, TrendingUp, Plus, Bluetooth, Wifi, User, MapPin, Zap, QrCode, Camera, Users } from "lucide-react";
import { useZKIdentity } from "@/hooks/useZKIdentity";
import { useToast } from "@/hooks/use-toast";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CrowdSimulation } from "@/lib/crowdSimulation";
import { Progress } from "@/components/ui/progress";

export default function HomeScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [crowdStats, setCrowdStats] = useState({ totalAttendees: 0, currentVisible: 0 });
  const [nearbyUsers, setNearbyUsers] = useState<Array<{
    id: string;
    username: string;
    distance: string;
    signal: 'strong' | 'medium' | 'weak';
    method: 'bluetooth' | 'wifi';
    connected: boolean;
    ephemeralId?: string;
    lastSeen: number;
  }>>([]);
  
  const crowdSimulation = useRef<CrowdSimulation | null>(null);
  
  const { generateCoPresenceProof, identity, isGeneratingProof } = useZKIdentity();
  const { toast } = useToast();

  // Initialize crowd simulation
  useEffect(() => {
    crowdSimulation.current = new CrowdSimulation({
      totalAttendees: 500000,
      batchSize: 200,
      maxNearbyVisible: 8,
      scanIntervalMs: 1500
    });
    
    const stats = crowdSimulation.current.getStats();
    setCrowdStats({ 
      totalAttendees: stats.totalAttendees, 
      currentVisible: 0 
    });
    
    toast({
      title: "Crowd Simulation Ready 🏟️",
      description: `${stats.totalAttendees.toLocaleString()} attendees simulated`,
    });
  }, [toast]);

  const handleDetectNearby = async () => {
    if (!crowdSimulation.current || isScanning) return;
    
    setIsScanning(true);
    setNearbyUsers([]);
    setScanProgress(0);
    
    toast({
      title: "Large Scale Scanning 📡",
      description: "Processing 500K+ attendees with optimized batching...",
    });

    try {
      await crowdSimulation.current.startScanning(
        (users, isComplete) => {
          setNearbyUsers(users);
          setCrowdStats(prev => ({ 
            ...prev, 
            currentVisible: users.length 
          }));
          
          if (isComplete) {
            setIsScanning(false);
            toast({
              title: "Scan Complete ✅",
              description: `Found ${users.length} nearby users from crowd of ${crowdStats.totalAttendees.toLocaleString()}`,
            });
          }
        },
        (progress) => {
          setScanProgress(Math.round(progress * 100));
        }
      );
    } catch (error) {
      setIsScanning(false);
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: "Failed to scan nearby users. Please try again.",
      });
    }
  };

  const generateEphemeralId = () => {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const handleConnect = async (userId: string, username: string) => {
    if (connectingTo || isGeneratingProof) return;

    setConnectingTo(userId);
    
    try {
      // Simulate ephemeral ID exchange
      toast({
        title: "Initiating Connection",
        description: `Exchanging ephemeral IDs with ${username}...`,
      });

      // Simulate BLE handshake delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const ephemeralId = generateEphemeralId();
      
      // Update user as connected with ephemeral ID
      setNearbyUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, connected: true, ephemeralId }
            : user
        )
      );
      
      // Update in crowd simulation
      crowdSimulation.current?.updateUserConnection(userId, true, ephemeralId);

      toast({
        title: "Connection Established! 🔗",
        description: `Ephemeral ID: ${ephemeralId}`,
      });

      // Generate ZK proof of co-presence
      const userIdA = identity?.identityCommitment || "0x" + generateEphemeralId();
      const userIdB = userId;
      const usernameA = "You";
      
      await generateCoPresenceProof(
        userIdA,
        userIdB,
        usernameA,
        username,
        ephemeralId,
        "BLE Range"
      );

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Failed to establish connection. Please try again.",
      });
    } finally {
      setConnectingTo(null);
    }
  };

  const getSignalColor = (signal: 'strong' | 'medium' | 'weak') => {
    switch (signal) {
      case 'strong': return 'text-success';
      case 'medium': return 'text-warning';
      case 'weak': return 'text-muted-foreground';
    }
  };
  return (
    <div className="p-6 pb-24 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">Your privacy-first event verification dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-card bg-gradient-dark">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Total Proofs</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-gradient-dark">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="p-2 bg-warning/20 rounded-lg">
              <Users className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{crowdStats.totalAttendees.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Crowd Size</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Activity
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <div className="flex-1">
              <p className="font-medium">DevCon 2024</p>
              <p className="text-sm text-muted-foreground">Proof generated successfully</p>
            </div>
            <span className="text-xs text-muted-foreground">2h ago</span>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <div className="flex-1">
              <p className="font-medium">ETH Global Hackathon</p>
              <p className="text-sm text-muted-foreground">Event joined</p>
            </div>
            <span className="text-xs text-muted-foreground">1d ago</span>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-2 h-2 bg-warning rounded-full"></div>
            <div className="flex-1">
              <p className="font-medium">Privacy Summit</p>
              <p className="text-sm text-muted-foreground">Verification pending</p>
            </div>
            <span className="text-xs text-muted-foreground">3d ago</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" variant="gradient">
            <Plus className="w-4 h-4 mr-2" />
            Generate New Proof
          </Button>
          <Button variant="outline" className="w-full">
            <Calendar className="w-4 h-4 mr-2" />
            Browse Events
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={handleDetectNearby}
              disabled={isScanning}
              variant="secondary" 
              className="w-full"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Bluetooth className="w-4 h-4 mr-2" />
                  BLE Scan
                </>
              )}
            </Button>
            <Button 
              onClick={() => setShowQRGenerator(true)}
              variant="secondary" 
              className="w-full"
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Share
            </Button>
          </div>
          <Button 
            onClick={() => setShowQRScanner(true)}
            variant="outline" 
            className="w-full"
          >
            <Camera className="w-4 h-4 mr-2" />
            Scan QR Code
          </Button>
        </CardContent>
      </Card>

      {/* Nearby Users */}
      {(nearbyUsers.length > 0 || isScanning) && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Nearby Users
                {isScanning && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {crowdStats.currentVisible}/{crowdStats.totalAttendees.toLocaleString()}
              </Badge>
            </CardTitle>
            {isScanning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Scanning progress</span>
                  <span className="text-primary font-medium">{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} className="h-2" />
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {nearbyUsers.length === 0 && isScanning && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="relative">
                  <Bluetooth className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
                </div>
                <p className="mb-2">Scanning massive crowd...</p>
                <p className="text-xs">Processing {crowdStats.totalAttendees.toLocaleString()} attendees with AI optimization</p>
              </div>
            )}
            
            {nearbyUsers.map((user) => (
              <div 
                key={user.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg animate-fade-in"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {user.method === 'bluetooth' ? (
                      <Bluetooth className={`w-4 h-4 ${getSignalColor(user.signal)}`} />
                    ) : (
                      <Wifi className={`w-4 h-4 ${getSignalColor(user.signal)}`} />
                    )}
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {user.distance}
                  </Badge>
                  {user.connected ? (
                    <div className="flex items-center space-x-2">
                      <Badge variant="default" className="text-xs bg-success/20 text-success">
                        <Zap className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                      {user.ephemeralId && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {user.ephemeralId.slice(0, 6)}...
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleConnect(user.id, user.username)}
                      disabled={connectingTo === user.id || isGeneratingProof}
                    >
                      {connectingTo === user.id ? (
                        <>
                          <div className="w-3 h-3 mr-1 border border-primary border-t-transparent rounded-full animate-spin" />
                          Connecting
                        </>
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {nearbyUsers.length > 0 && !isScanning && (
              <div className="flex justify-center gap-2 pt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    const refreshed = crowdSimulation.current?.refreshNearby() || [];
                    setNearbyUsers(refreshed);
                    setCrowdStats(prev => ({ ...prev, currentVisible: refreshed.length }));
                  }}
                  className="text-muted-foreground"
                >
                  Refresh
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setNearbyUsers([]);
                    setCrowdStats(prev => ({ ...prev, currentVisible: 0 }));
                  }}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* QR Code Dialogs */}
      <Dialog open={showQRGenerator} onOpenChange={setShowQRGenerator}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your QR Code</DialogTitle>
          </DialogHeader>
          <QRCodeGenerator onClose={() => setShowQRGenerator(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
          </DialogHeader>
          <QRCodeScanner 
            onClose={() => setShowQRScanner(false)}
            onProofGenerated={() => {
              setShowQRScanner(false);
              // Optionally refresh nearby users or show success message
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}