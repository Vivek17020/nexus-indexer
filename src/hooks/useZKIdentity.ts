import { useState, useEffect } from 'react';
import { ZKIdentityManager, type ZKCredential, type ZKIdentity, type ZKCoPresenceProof, type GroupProof } from '@/lib/zkIdentity';
import { useToast } from '@/hooks/use-toast';
import { BlockchainManager } from '@/lib/blockchain';

export function useZKIdentity() {
  const [identity, setIdentity] = useState<ZKIdentity | null>(null);
  const [credentials, setCredentials] = useState<ZKCredential[]>([]);
  const [coPresenceProofs, setCoPresenceProofs] = useState<ZKCoPresenceProof[]>([]);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [isSubmittingToBlockchain, setIsSubmittingToBlockchain] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [showRewardScreen, setShowRewardScreen] = useState(false);
  const [rewardData, setRewardData] = useState<{
    eventName: string;
    nftImage?: string;
    txHash?: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load identity, credentials, and co-presence proofs on mount
    const initializeData = async () => {
      try {
        const loadedIdentity = await ZKIdentityManager.getOrCreateIdentity();
        const loadedCredentials = ZKIdentityManager.getStoredCredentials();
        const loadedCoPresenceProofs = ZKIdentityManager.getStoredCoPresenceProofs();
        
        setIdentity(loadedIdentity);
        setCredentials(loadedCredentials);
        setCoPresenceProofs(loadedCoPresenceProofs);

        // Check wallet connection
        checkWalletConnection();
      } catch (error) {
        console.error('Failed to initialize ZK identity data:', error);
        toast({
          variant: "destructive",
          title: "Initialization Failed",
          description: "Failed to load ZK identity. Some features may not work properly.",
        });
      }
    };

    initializeData();
  }, []);

  const loadUserNFTs = async () => {
    if (!walletConnected) return;
    
    setIsLoadingNFTs(true);
    try {
      const userAddress = await BlockchainManager.getAddress();
      if (userAddress) {
        const nfts = await BlockchainManager.getUserNFTs(userAddress);
        setUserNFTs(nfts);
      }
    } catch (error) {
      console.error('Failed to load user NFTs:', error);
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  const checkWalletConnection = async () => {
    const connected = await BlockchainManager.isConnected();
    setWalletConnected(connected);
  };

  const connectWallet = async () => {
    const connected = await BlockchainManager.connectWallet();
    setWalletConnected(connected);
    
    if (connected) {
      toast({
        title: "Wallet Connected! 🔗",
        description: "You can now submit proofs to the blockchain",
      });
      // Load user NFTs after connecting
      loadUserNFTs();
    } else {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Please install MetaMask and try again",
      });
    }
    
    return connected;
  };

  const generateEventCredential = async (
    eventId: string,
    eventName: string,
    metadata?: ZKCredential['metadata']
  ) => {
    if (isGeneratingProof) return;

    setIsGeneratingProof(true);
    
    try {
      toast({
        title: "Generating ZK Proof",
        description: "Creating attendance credential for " + eventName,
      });

      const credential = await ZKIdentityManager.generateEventCredential(
        eventId,
        eventName,
        metadata
      );

      setCredentials(prev => [...prev, credential]);

      toast({
        title: "Credential Generated! 🎫",
        description: `Successfully created proof for ${eventName}`,
      });

      // Trigger confetti animation
      if (typeof window !== 'undefined') {
        import('canvas-confetti').then(confetti => {
          confetti.default({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B']
          });
        });
      }

      return credential;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Proof Generation Failed",
        description: "Failed to generate ZK credential. Please try again.",
      });
      throw error;
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const verifyCredential = async (credential: ZKCredential) => {
    try {
      const isValid = await ZKIdentityManager.verifyCredential(credential);
      
      toast({
        title: isValid ? "Credential Valid ✅" : "Credential Invalid ❌",
        description: isValid 
          ? "The ZK proof is cryptographically valid" 
          : "The ZK proof verification failed",
      });

      return isValid;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Failed to verify credential. Please try again.",
      });
      return false;
    }
  };

  const generateCoPresenceProof = async (
    userIdA: string,
    userIdB: string,
    usernameA: string,
    usernameB: string,
    ephemeralNonce: string,
    location?: string
  ) => {
    if (isGeneratingProof) return;

    setIsGeneratingProof(true);
    
    try {
      toast({
        title: "Generating Co-Presence Proof",
        description: "Creating ZK proof of meeting...",
      });

      const proof = await ZKIdentityManager.generateCoPresenceProof(
        userIdA,
        userIdB,
        usernameA,
        usernameB,
        ephemeralNonce,
        location
      );

      setCoPresenceProofs(prev => [...prev, proof]);

      toast({
        title: "Co-Presence Proof Generated! 🤝",
        description: `Proof of co-presence with ${proof.userIdB.slice(0, 8)}... at ${proof.eventId.slice(0, 12)}...`,
      });

      // Trigger confetti animation
      if (typeof window !== 'undefined') {
        import('canvas-confetti').then(confetti => {
          confetti.default({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B']
          });
        });
      }

      return proof;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Proof Generation Failed",
        description: "Failed to generate co-presence proof. Please try again.",
      });
      throw error;
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const submitProofToBlockchain = async (credential: ZKCredential) => {
    if (!walletConnected) {
      const connected = await connectWallet();
      if (!connected) return null;
    }

    setIsSubmittingToBlockchain(true);
    
    try {
      toast({
        title: "Submitting to Polygon zkEVM ⛓️",
        description: "Publishing your proof on-chain...",
      });

      const result = await BlockchainManager.submitProofToBlockchain(
        credential.eventId,
        credential.proof
      );

      if (result) {
        toast({
          title: "Proof Submitted! 🎉",
          description: `Transaction: ${result.txHash.slice(0, 10)}...`,
        });

        // Show reward screen with transaction info
        setRewardData({
          eventName: credential.eventName,
          nftImage: credential.metadata?.image,
          txHash: result.txHash
        });
        setShowRewardScreen(true);

        return result;
      } else {
        throw new Error('Failed to submit to blockchain');
      }
    } catch (error: any) {
      let errorMessage = "Please try again or check your wallet";
      
      if (error.message?.includes('Insufficient ETH')) {
        errorMessage = "Insufficient ETH for gas fees. Get testnet ETH from faucet.";
      } else if (error.message?.includes('rejected')) {
        errorMessage = "Transaction was rejected";
      } else if (error.message?.includes('already submitted')) {
        errorMessage = "This proof has already been submitted";
      }

      toast({
        variant: "destructive",
        title: "Blockchain Submission Failed",
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsSubmittingToBlockchain(false);
    }
  };

  const submitGroupProofToBlockchain = async (groupProof: GroupProof) => {
    if (!walletConnected) {
      const connected = await connectWallet();
      if (!connected) return null;
    }

    setIsSubmittingToBlockchain(true);
    
    try {
      toast({
        title: "Submitting Group Proof ⛓️",
        description: `Publishing proof for ${groupProof.participants.length} participants...`,
      });

      const result = await BlockchainManager.submitGroupProofToBlockchain(groupProof);

      if (result) {
        toast({
          title: "Group Proof Submitted! 🎉",
          description: `Transaction: ${result.txHash.slice(0, 10)}...`,
        });

        // Show reward screen for group proof
        setRewardData({
          eventName: `${groupProof.eventName} (Group)`,
          nftImage: undefined,
          txHash: result.txHash
        });
        setShowRewardScreen(true);

        return result;
      } else {
        throw new Error('Failed to submit group proof to blockchain');
      }
    } catch (error: any) {
      let errorMessage = "Please try again or check your wallet";
      
      if (error.message?.includes('Insufficient ETH')) {
        errorMessage = "Insufficient ETH for gas fees";
      } else if (error.message?.includes('rejected')) {
        errorMessage = "Transaction was rejected";
      }

      toast({
        variant: "destructive",
        title: "Group Proof Submission Failed",
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsSubmittingToBlockchain(false);
    }
  };

  const getBlockchainStats = async () => {
    try {
      const totalProofs = await BlockchainManager.getTotalProofs();
      const userAddress = await BlockchainManager.getAddress();
      const userProofs = userAddress ? await BlockchainManager.getUserProofs(userAddress) : [];
      const userNFTCount = userAddress ? await BlockchainManager.getUserNFTCount(userAddress) : 0;
      
      return {
        totalOnChainProofs: totalProofs,
        userOnChainProofs: userProofs.length,
        userNFTCount
      };
    } catch (error) {
      return {
        totalOnChainProofs: 0,
        userOnChainProofs: 0,
        userNFTCount: 0
      };
    }
  };

  const exportCredentials = () => {
    try {
      const data = ZKIdentityManager.exportCredentials();
      
      // Create download link
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zk-credentials-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Credentials Exported 📁",
        description: "Your ZK credentials have been exported successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export credentials. Please try again.",
      });
    }
  };

  const getStats = () => {
    return ZKIdentityManager.getIdentityStats();
  };

  const clearAll = async () => {
    ZKIdentityManager.clearAll();
    const newIdentity = await ZKIdentityManager.getOrCreateIdentity();
    setIdentity(newIdentity);
    setCredentials([]);
    setCoPresenceProofs([]);
    
    toast({
      title: "Data Cleared",
      description: "All ZK identity data has been cleared",
    });
  };

  const closeRewardScreen = () => {
    setShowRewardScreen(false);
    setRewardData(null);
  };

  return {
    identity,
    credentials,
    coPresenceProofs,
    userNFTs,
    isGeneratingProof,
    isSubmittingToBlockchain,
    isLoadingNFTs,
    walletConnected,
    showRewardScreen,
    rewardData,
    generateEventCredential,
    generateCoPresenceProof,
    verifyCredential,
    exportCredentials,
    getStats,
    clearAll,
    connectWallet,
    submitProofToBlockchain,
    submitGroupProofToBlockchain,
    getBlockchainStats,
    loadUserNFTs,
    closeRewardScreen
  };
}