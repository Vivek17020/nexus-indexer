// Blockchain integration for ZK proof submission and verification
import { ethers } from 'ethers';
import contractDeployment from '@/contracts/deployment.json';
import type { GroupProof } from '@/lib/groupProofs';

// Mock NFT data for demonstration
const mockNFTs = [
  {
    tokenId: '1',
    name: 'ETH Denver 2025 Attendee',
    description: 'Proof of attendance at ETH Denver 2025',
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=400&fit=crop',
    eventId: 'eth-denver-2025',
    mintedAt: new Date().toISOString()
  },
  {
    tokenId: '2', 
    name: 'ZK Summit 11 Badge',
    description: 'Verified participant at ZK Summit 11',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop',
    eventId: 'zk-summit-11',
    mintedAt: new Date().toISOString()
  },
  {
    tokenId: '3',
    name: 'Privacy Tech Meetup',
    description: 'Active participant in Privacy Tech community',
    image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=400&fit=crop',
    eventId: 'privacy-tech-meetup',
    mintedAt: new Date().toISOString()
  }
];

export class BlockchainManager {
  private static contract: ethers.Contract | null = null;
  private static signer: ethers.Signer | null = null;
  private static provider: ethers.BrowserProvider | null = null;

  static async connectWallet(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        console.error('MetaMask not detected');
        return false;
      }

      // Create provider
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get signer
      this.signer = await this.provider.getSigner();
      
      // Switch to Polygon Mumbai testnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13881' }], // Mumbai testnet
        });
      } catch (switchError: any) {
        // Add the network if it doesn't exist
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x13881',
              chainName: 'Polygon Mumbai',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
              blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
            }],
          });
        }
      }

      console.log('✅ Wallet connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      return false;
    }
  }

  static async isConnected(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        return false;
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts && accounts.length > 0;
    } catch (error) {
      return false;
    }
  }

  static async getAddress(): Promise<string | null> {
    try {
      if (!this.signer) {
        await this.connectWallet();
      }
      
      if (this.signer) {
        return await this.signer.getAddress();
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get address:', error);
      return null;
    }
  }

  private static async getContractWithSigner(): Promise<{signer: ethers.Signer, contract: ethers.Contract}> {
    if (!this.signer) {
      const connected = await this.connectWallet();
      if (!connected) {
        throw new Error('Failed to connect wallet');
      }
    }

    if (!this.contract) {
      this.contract = new ethers.Contract(
        contractDeployment.contractAddress,
        contractDeployment.abi,
        this.signer!
      );
    }

    return { signer: this.signer!, contract: this.contract };
  }

  static async submitProofToBlockchain(eventId: string, proof: string | Uint8Array): Promise<{txHash: string} | null> {
    try {
      const { signer, contract } = await this.getContractWithSigner();
      
      // Convert proof to string if needed
      const proofString = typeof proof === 'string' ? proof : 
                         proof instanceof Uint8Array ? ethers.hexlify(proof) : proof;

      console.log('📤 Submitting proof to blockchain:', { eventId, proof: proofString });

      // Submit proof to contract
      const tx = await contract.submitProof(eventId, proofString);
      console.log('⏳ Transaction submitted:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Proof submitted successfully:', receipt.hash);
      
      return {
        txHash: tx.hash
      };
    } catch (error) {
      console.error('❌ Failed to submit proof to blockchain:', error);
      return null;
    }
  }

  static async submitGroupProofToBlockchain(groupProof: GroupProof): Promise<{txHash: string; proofId: string} | null> {
    try {
      const { signer, contract } = await this.getContractWithSigner();
      
      // Create a combined eventId for group proof
      const groupEventId = `${groupProof.eventId}_group_${groupProof.participants.length}`;
      
      // Use merkle root as proof string for group proofs
      const proofString = groupProof.merkleRoot;
      
      console.log('Submitting group proof to blockchain:', {
        eventId: groupEventId,
        proof: proofString,
        participants: groupProof.participants.length
      });

      // Submit group proof to contract
      const tx = await contract.submitProof(groupEventId, proofString);
      const receipt = await tx.wait();
      
      console.log('Group proof submitted successfully:', receipt.hash);
      
      return {
        txHash: receipt.hash,
        proofId: receipt.hash // Using tx hash as proof ID for simplicity
      };
    } catch (error) {
      console.error('Failed to submit group proof to blockchain:', error);
      return null;
    }
  }

  static async getTotalProofs(): Promise<number> {
    try {
      const { contract } = await this.getContractWithSigner();
      const total = await contract.getTotalProofs();
      return parseInt(total.toString());
    } catch (error) {
      console.error('Failed to get total proofs:', error);
      return 0;
    }
  }

  static async getUserProofs(userAddress: string): Promise<string[]> {
    try {
      const { contract } = await this.getContractWithSigner();
      const proofs = await contract.getUserProofs(userAddress);
      return proofs;
    } catch (error) {
      console.error('Failed to get user proofs:', error);
      return [];
    }
  }

  static async getUserNFTs(userAddress: string): Promise<any[]> {
    try {
      // Mock implementation - in real app would query NFT contract or indexer
      const userProofs = await this.getUserProofs(userAddress);
      
      // Return mock NFTs based on number of proofs
      return mockNFTs.slice(0, Math.min(userProofs.length, mockNFTs.length));
    } catch (error) {
      console.error('Failed to get user NFTs:', error);
      return [];
    }
  }

  static getContractUrl(): string {
    return `${contractDeployment.explorerUrl}/address/${contractDeployment.contractAddress}`;
  }

  static async getUserNFTCount(userAddress: string): Promise<number> {
    try {
      const nfts = await this.getUserNFTs(userAddress);
      return nfts.length;
    } catch (error) {
      console.error('Failed to get user NFT count:', error);
      return 0;
    }
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}