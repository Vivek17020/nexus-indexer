// Real Blockchain integration for ZK proof submission on Polygon zkEVM testnet
import { ethers } from 'ethers';
import contractDeployment from '@/contracts/deployment.json';
import type { GroupProof } from '@/lib/groupProofs';

// Chain configuration for Polygon zkEVM testnet
const POLYGON_ZKEVM_TESTNET = {
  chainId: '0x5A2', // 1442 in hex
  chainName: 'Polygon zkEVM Testnet',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.public.zkevm-test.net'],
  blockExplorerUrls: ['https://testnet-zkevm.polygonscan.com/'],
};

interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
  blockNumber?: number;
}

export class BlockchainManager {
  private static contract: ethers.Contract | null = null;
  private static signer: ethers.Signer | null = null;
  private static provider: ethers.BrowserProvider | null = null;
  private static pendingTransactions: Map<string, TransactionStatus> = new Map();

  static async connectWallet(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        console.error('❌ MetaMask not detected');
        return false;
      }

      console.log('🔌 Connecting to Polygon zkEVM testnet...');
      
      // Create provider
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Switch to Polygon zkEVM testnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: POLYGON_ZKEVM_TESTNET.chainId }],
        });
      } catch (switchError: any) {
        // Add the network if it doesn't exist
        if (switchError.code === 4902) {
          console.log('➕ Adding Polygon zkEVM testnet to wallet...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [POLYGON_ZKEVM_TESTNET],
          });
        } else {
          throw switchError;
        }
      }
      
      // Get signer
      this.signer = await this.provider.getSigner();
      
      // Verify we're on the correct network
      const network = await this.provider.getNetwork();
      if (Number(network.chainId) !== 1442) {
        throw new Error(`Wrong network. Expected Polygon zkEVM testnet (1442), got ${network.chainId}`);
      }

      console.log('✅ Successfully connected to Polygon zkEVM testnet');
      console.log('📍 Network:', network.name, 'Chain ID:', network.chainId);
      
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      console.log('👛 Address:', address);
      console.log('💰 Balance:', ethers.formatEther(balance), 'ETH');
      
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

  static async submitProofToBlockchain(
    eventId: string, 
    proof: string | Uint8Array
  ): Promise<{ txHash: string; status: TransactionStatus; nftTokenId?: string } | null> {
    try {
      const { signer, contract } = await this.getContractWithSigner();
      
      // Convert proof to bytes format for the contract
      let proofBytes: string;
      if (typeof proof === 'string') {
        // If it's a hex string, use as is, otherwise convert
        proofBytes = proof.startsWith('0x') ? proof : ethers.hexlify(ethers.toUtf8Bytes(proof));
      } else {
        // Convert Uint8Array to hex string
        proofBytes = ethers.hexlify(proof);
      }
      
      console.log('📤 Submitting proof to Polygon zkEVM:', { 
        eventId, 
        proofLength: proofBytes.length,
        contractAddress: await contract.getAddress()
      });

      // Estimate gas first
      const gasEstimate = await contract.submitProof.estimateGas(eventId, proofBytes);
      const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer
      
      console.log('⛽ Gas estimate:', gasEstimate.toString());

      // Submit proof to contract with gas limit
      const tx = await contract.submitProof(eventId, proofBytes, {
        gasLimit: gasLimit
      });
      
      console.log('📋 Transaction submitted:', tx.hash);
      console.log('🔍 Explorer:', `${contractDeployment.explorerUrl}/tx/${tx.hash}`);
      
      // Create transaction status
      const status: TransactionStatus = {
        hash: tx.hash,
        status: 'pending',
        confirmations: 0
      };
      
      this.pendingTransactions.set(tx.hash, status);
      
      // Start monitoring transaction
      this.monitorTransaction(tx.hash);
      
      return {
        txHash: tx.hash,
        status,
        nftTokenId: undefined // Will be updated when transaction confirms
      };
    } catch (error: any) {
      console.error('❌ Failed to submit proof to blockchain:', error);
      
      // Parse specific error messages
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient ETH balance for transaction fees');
      } else if (error.code === 'USER_REJECTED') {
        throw new Error('Transaction was rejected by user');
      } else if (error.message?.includes('Proof already submitted')) {
        throw new Error('This proof has already been submitted');
      }
      
      throw error;
    }
  }

  // Monitor transaction status
  static async monitorTransaction(txHash: string): Promise<void> {
    try {
      if (!this.provider) return;
      
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) return;
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt) {
        const status: TransactionStatus = {
          hash: txHash,
          status: receipt.status === 1 ? 'confirmed' : 'failed',
          confirmations: await this.provider.getBlockNumber() - receipt.blockNumber + 1,
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: receipt.gasPrice?.toString(),
          blockNumber: receipt.blockNumber
        };
        
        this.pendingTransactions.set(txHash, status);
        
        if (receipt.status === 1) {
          console.log('✅ Transaction confirmed:', txHash);
          console.log('📊 Gas used:', receipt.gasUsed.toString());
          
          // Parse events for NFT minting
          if (this.contract) {
            const events = await this.contract.queryFilter(
              this.contract.filters.NFTMinted(),
              receipt.blockNumber,
              receipt.blockNumber
            );
            
            for (const event of events) {
              if (event.transactionHash === txHash) {
                console.log('🎁 NFT minted! Token ID:', (event as any).args?.tokenId?.toString());
              }
            }
          }
        } else {
          console.error('❌ Transaction failed:', txHash);
        }
      }
    } catch (error) {
      console.error('Failed to monitor transaction:', error);
      
      const status: TransactionStatus = {
        hash: txHash,
        status: 'failed',
        confirmations: 0
      };
      
      this.pendingTransactions.set(txHash, status);
    }
  }

  static async submitGroupProofToBlockchain(groupProof: GroupProof): Promise<{txHash: string; proofId: string} | null> {
    try {
      const { signer, contract } = await this.getContractWithSigner();
      
      // Create a combined eventId for group proof
      const groupEventId = `${groupProof.eventId}_group_${groupProof.participants.length}`;
      
      // Convert merkle root to bytes format
      const proofBytes = ethers.hexlify(ethers.toUtf8Bytes(groupProof.merkleRoot));
      
      console.log('📤 Submitting group proof to blockchain:', {
        eventId: groupEventId,
        participants: groupProof.participants.length,
        merkleRoot: groupProof.merkleRoot
      });

      const tx = await contract.submitProof(groupEventId, proofBytes);
      console.log('📋 Group proof transaction:', tx.hash);
      
      return {
        txHash: tx.hash,
        proofId: tx.hash
      };
    } catch (error) {
      console.error('❌ Failed to submit group proof:', error);
      return null;
    }
  }

  static async getUserNFTs(userAddress: string): Promise<any[]> {
    try {
      const { contract } = await this.getContractWithSigner();
      
      // Get user's NFT balance
      const balance = await contract.balanceOf(userAddress);
      const balanceNumber = parseInt(balance.toString());
      
      console.log(`👛 User has ${balanceNumber} NFTs`);
      
      const nfts = [];
      
      // Get each NFT owned by user
      for (let i = 0; i < balanceNumber; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
          const tokenURI = await contract.tokenURI(tokenId);
          
          nfts.push({
            tokenId: tokenId.toString(),
            tokenURI,
            name: `ZK Proof NFT #${tokenId}`,
            description: 'Proof of attendance NFT',
            image: tokenURI // In production, this would parse metadata JSON
          });
        } catch (error) {
          console.warn(`Failed to get NFT at index ${i}:`, error);
        }
      }
      
      return nfts;
    } catch (error) {
      console.error('Failed to get user NFTs:', error);
      return [];
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
      return proofs.map((proof: any) => proof.toString());
    } catch (error) {
      console.error('Failed to get user proofs:', error);
      return [];
    }
  }

  static getContractUrl(): string {
    return `${contractDeployment.explorerUrl}/address/${contractDeployment.contractAddress}`;
  }

  static async getUserNFTCount(userAddress: string): Promise<number> {
    try {
      const { contract } = await this.getContractWithSigner();
      const balance = await contract.balanceOf(userAddress);
      return parseInt(balance.toString());
    } catch (error) {
      console.error('Failed to get user NFT count:', error);
      return 0;
    }
  }

  static getTransactionStatus(txHash: string): TransactionStatus | null {
    return this.pendingTransactions.get(txHash) || null;
  }

  static getAllPendingTransactions(): TransactionStatus[] {
    return Array.from(this.pendingTransactions.values()).filter(tx => tx.status === 'pending');
  }

  static clearTransactionHistory(): void {
    this.pendingTransactions.clear();
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}