import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getStoredWallet } from "@/lib/wallet";
import { toast } from "sonner";
import { 
  User, 
  Shield, 
  Settings, 
  Bell, 
  Lock, 
  Download, 
  LogOut,
  Award,
  Calendar,
  TrendingUp,
  Copy,
  Wallet
} from "lucide-react";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [wallet, setWallet] = useState(getStoredWallet());

  useEffect(() => {
    setWallet(getStoredWallet());
  }, [user]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
    }
  };
  return (
    <div className="p-6 pb-24 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
          <User className="w-10 h-10 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {user?.user_metadata?.display_name || 'Anonymous User'}
          </h1>
          <p className="text-muted-foreground">
            {user?.user_metadata?.is_anonymous ? 'Anonymous Account' : 'Registered Account'}
          </p>
        </div>
      </div>

      {/* Anonymous Credentials */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Anonymous Credentials
          </CardTitle>
          <CardDescription>Your privacy-preserving digital identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Masked Wallet Address */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Wallet Address</div>
            <div className="flex items-center gap-3 p-4 bg-gradient-subtle rounded-lg border">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <code className="text-sm font-mono text-foreground">
                  {wallet ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : '0x****...****'}
                </code>
                <p className="text-xs text-muted-foreground mt-1">
                  Anonymous wallet • Locally generated
                </p>
              </div>
              {wallet && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => copyToClipboard(wallet.address, 'Wallet address')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* ZK Badge Placeholder */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Zero-Knowledge Badges</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-gradient-subtle rounded-lg border border-dashed border-muted-foreground/30 text-center">
                <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Privacy Pioneer</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  Coming Soon
                </Badge>
              </div>
              <div className="p-4 bg-gradient-subtle rounded-lg border border-dashed border-muted-foreground/30 text-center">
                <Award className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Event Attendee</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  Coming Soon
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Earn badges by attending events and generating proofs
            </p>
          </div>

          {/* Credential Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground">Active Proofs</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-success">0</p>
              <p className="text-xs text-muted-foreground">Events Joined</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-warning">0</p>
              <p className="text-xs text-muted-foreground">Badges Earned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Event updates and proofs</p>
              </div>
            </div>
            <Switch checked={true} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Analytics</p>
                <p className="text-sm text-muted-foreground">Anonymous usage data</p>
              </div>
            </div>
            <Switch checked={false} />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="shadow-card">
        <CardContent className="p-4 space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Download className="w-4 h-4 mr-3" />
            Export Data
          </Button>
          
          <Button variant="outline" className="w-full justify-start">
            <Shield className="w-4 h-4 mr-3" />
            Security Settings
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>ZKPresence v1.0.0</p>
        <p>Built with zero-knowledge proofs</p>
      </div>
    </div>
  );
}