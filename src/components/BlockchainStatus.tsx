import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Link, ExternalLink, Shield, Activity } from 'lucide-react';
import { useZKIdentity } from '@/hooks/useZKIdentity';
import { BlockchainManager } from '@/lib/blockchain';
import deploymentInfo from '@/contracts/deployment.json';

export default function BlockchainStatus() {
  const { walletConnected, connectWallet, getBlockchainStats } = useZKIdentity();
  const [address, setAddress] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalOnChainProofs: 0, userOnChainProofs: 0 });

  useEffect(() => {
    if (walletConnected) {
      loadWalletInfo();
      loadStats();
    }
  }, [walletConnected]);

  const loadWalletInfo = async () => {
    const addr = await BlockchainManager.getAddress();
    setAddress(addr);
  };

  const loadStats = async () => {
    const blockchainStats = await getBlockchainStats();
    setStats(blockchainStats);
  };

  return (
    <Card className="shadow-card border-l-4 border-l-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
            <Link className="w-5 h-5 text-primary" />
          </div>
          Blockchain Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Info */}
        <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Network:</span>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {deploymentInfo.network}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Contract:</span>
            <div className="flex items-center gap-2">
              <code className="font-mono text-xs bg-background px-2 py-1 rounded border">
                {deploymentInfo.contractAddress.slice(0, 8)}...
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => window.open(BlockchainManager.getContractUrl(), '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        <div className="space-y-3">
          {walletConnected ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <Activity className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
              {address && (
                <div className="bg-muted/30 p-2 rounded border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Address:</span>
                    <code className="font-mono text-xs">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </code>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button 
              onClick={connectWallet}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>

        {/* On-Chain Stats */}
        {walletConnected && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-primary/10 to-transparent p-3 rounded-lg border border-primary/20">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">{stats.totalOnChainProofs}</div>
                <div className="text-xs text-muted-foreground">Total On-Chain</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-secondary/10 to-transparent p-3 rounded-lg border border-secondary/20">
              <div className="text-center">
                <div className="text-lg font-bold text-secondary">{stats.userOnChainProofs}</div>
                <div className="text-xs text-muted-foreground">Your Proofs</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {walletConnected && (
          <div className="pt-2 border-t border-border/30">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => window.open(BlockchainManager.getContractUrl(), '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Contract
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={loadStats}
              >
                <Shield className="w-3 h-3 mr-1" />
                Refresh Stats
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}