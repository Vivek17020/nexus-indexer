import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { BlockchainManager } from "@/lib/blockchain";

interface TransactionStatusProps {
  txHash: string;
  onClose?: () => void;
}

export default function TransactionStatus({ txHash, onClose }: TransactionStatusProps) {
  const [status, setStatus] = useState(BlockchainManager.getTransactionStatus(txHash));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStatus = async () => {
    setIsRefreshing(true);
    try {
      // Trigger a status refresh by monitoring the transaction again
      await BlockchainManager.monitorTransaction(txHash);
      const updatedStatus = BlockchainManager.getTransactionStatus(txHash);
      setStatus(updatedStatus);
    } catch (error) {
      console.error('Failed to refresh transaction status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = () => {
    switch (status?.status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status?.status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  if (!status) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-gray-500" />
            Transaction Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Could not find status for transaction {formatHash(txHash)}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            Transaction Status
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Hash:</span>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {formatHash(status.hash)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(
                  `https://testnet-zkevm.polygonscan.com/tx/${status.hash}`,
                  '_blank'
                )}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant="secondary" className="gap-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Confirmations:</span>
            <span className="text-sm">{status.confirmations}</span>
          </div>
          
          {status.gasUsed && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Gas Used:</span>
              <span className="text-sm">{parseInt(status.gasUsed).toLocaleString()}</span>
            </div>
          )}
          
          {status.blockNumber && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Block:</span>
              <span className="text-sm">#{status.blockNumber}</span>
            </div>
          )}
        </div>

        {status.status === 'pending' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing...</span>
              <span>⏳</span>
            </div>
            <Progress value={33} className="w-full" />
            <p className="text-xs text-muted-foreground">
              This usually takes 1-3 minutes on Polygon zkEVM testnet
            </p>
          </div>
        )}

        {status.status === 'confirmed' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>✅ Transaction Confirmed!</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your ZK proof has been recorded on-chain and an NFT has been minted to your wallet.
            </p>
          </div>
        )}

        {status.status === 'failed' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-red-600">
              <span>❌ Transaction Failed</span>
            </div>
            <p className="text-xs text-muted-foreground">
              The transaction was reverted. This might be due to insufficient gas or a contract error.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatus}
            disabled={isRefreshing}
            className="flex-1"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Status"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(
              `https://testnet-zkevm.polygonscan.com/tx/${status.hash}`,
              '_blank'
            )}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}