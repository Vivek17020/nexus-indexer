import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Download, Share, Eye, CheckCircle, Clock, Gift, TrendingUp, Users, ExternalLink, Upload } from "lucide-react";
import { useZKIdentity } from "@/hooks/useZKIdentity";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import BlockchainStatus from "@/components/BlockchainStatus";
import { BlockchainManager } from "@/lib/blockchain";
import { RewardScreen } from "@/components/RewardScreen";

export default function ProofsScreen() {
  const { 
    credentials, 
    coPresenceProofs, 
    userNFTs,
    verifyCredential, 
    exportCredentials, 
    getStats,
    submitProofToBlockchain,
    isSubmittingToBlockchain,
    isLoadingNFTs,
    walletConnected,
    loadUserNFTs,
    showRewardScreen,
    rewardData,
    closeRewardScreen
  } = useZKIdentity();
  const stats = getStats();

  // Celebration animation for new proofs
  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B']
    });
  };

  // Listen for new proof generation
  useEffect(() => {
    const handleProofGenerated = () => {
      triggerCelebration();
    };
    
    // This would be triggered by the actual proof generation events
    // For now, we'll trigger it when credentials change
    if (credentials.length > 0) {
      const lastCredential = credentials[credentials.length - 1];
      const recentlyGenerated = Date.now() - lastCredential.timestamp < 5000; // Last 5 seconds
      if (recentlyGenerated) {
        setTimeout(triggerCelebration, 500);
      }
    }
  }, [credentials]);

  // Mock stats based on actual credentials or fallback to demo data
  const displayStats = credentials.length > 0 ? {
    totalProofs: stats.totalProofs,
    validProofs: stats.validProofs,
    eventsAttended: stats.events,
    totalRewards: stats.totalProofs * 50 // Mock reward calculation
  } : {
    totalProofs: 6,
    validProofs: 5,
    eventsAttended: 4,
    totalRewards: 300
  };

  // Combine event credentials and co-presence proofs
  const eventProofs = credentials.length > 0 ? credentials.map(cred => ({
    id: cred.id,
    type: "Event Attendance",
    event: cred.eventName,
    status: cred.blockchainStatus || "Valid",
    date: new Date(cred.timestamp).toLocaleDateString(),
    reward: 50,
    icon: CheckCircle,
    description: `Zero-knowledge proof of attendance at ${cred.eventName}`,
    proof: cred.proof,
    location: cred.metadata.location || "Unknown",
    credential: cred, // Store full credential for blockchain submission
    eventId: cred.eventId,
    proofHash: cred.proof
  })) : [];

  const coPresenceProofsList = coPresenceProofs.map(proof => ({
    id: proof.eventId,
    type: "Co-Presence Proof",
    event: `Co-presence Meeting`,
    status: proof.blockchainStatus || "Valid",
    date: new Date(proof.timestamp).toLocaleDateString(),
    reward: 75,
    icon: Users,
    description: `Proof of co-presence with user ${proof.userIdB.slice(0, 8)}...`,
    proof: proof.proofString,
    location: proof.location || "Unknown",
    usernameB: proof.usernameB,
    ephemeralNonce: proof.ephemeralNonce,
    maskedUserId: proof.userIdB.slice(0, 8) + "...",
    eventId: proof.eventId,
    proofHash: proof.proofString
  }));

  // Combine all proofs
  const allProofs = [...eventProofs, ...coPresenceProofsList];

  // Use actual proofs if available, otherwise show demo data
  const displayProofs = allProofs.length > 0 ? allProofs : [
    {
      id: "1",
      type: "Event Attendance",
      event: "ETH Global London",
      status: "Valid" as const,
      date: "2024-03-15",
      reward: 50,
      icon: CheckCircle,
      description: "Zero-knowledge proof of attendance at ETH Global London hackathon",
      proof: "0x1a2b3c4d...",
      location: "London, UK"
    },
    {
      id: "2", 
      type: "Workshop Completion",
      event: "ZK Circuit Design Workshop",
      status: "Submitted" as const,
      date: "2024-03-10",
      reward: 75,
      icon: Clock,
      description: "Completed advanced zero-knowledge circuit design workshop",
      proof: "0x5e6f7g8h...",
      location: "Virtual"
    },
    {
      id: "3",
      type: "Conference Attendance", 
      event: "Devcon 7",
      status: "Valid" as const,
      date: "2024-03-08",
      reward: 100,
      icon: CheckCircle,
      description: "Verified attendance at Ethereum Developer Conference",
      proof: "0x9i0j1k2l...",
      location: "Bangkok, Thailand"
    },
    {
      id: "4",
      type: "Meetup Participation",
      event: "Local Crypto Meetup",
      status: "Rewarded" as const, 
      date: "2024-03-05",
      reward: 25,
      icon: Gift,
      description: "Active participation in monthly cryptocurrency meetup",
      proof: "0xm3n4o5p6...",
      location: "San Francisco, CA"
    },
    {
      id: "5",
      type: "Hackathon Submission",
      event: "DeFi Building Blocks",
      status: "Valid" as const,
      date: "2024-03-01", 
      reward: 150,
      icon: CheckCircle,
      description: "Submitted working DeFi protocol during 48-hour hackathon",
      proof: "0xq7r8s9t0...",
      location: "New York, NY"
    },
    {
      id: "6",
      type: "Training Completion",
      event: "Smart Contract Security",
      status: "Submitted" as const,
      date: "2024-02-28",
      reward: 50,
      icon: Clock,
      description: "Completed comprehensive smart contract security training program", 
      proof: "0xu1v2w3x4...",
      location: "Online"
    }
  ];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Valid':
        return 'bg-success hover:bg-success/80 text-success-foreground';
      case 'Submitted':  
        return 'bg-warning hover:bg-warning/80 text-warning-foreground';
      case 'Rewarded':
        return 'bg-primary hover:bg-primary/80 text-primary-foreground';
      default:
        return 'bg-muted hover:bg-muted/80';
    }
  };

  const handleSubmitToBlockchain = async (proof: any) => {
    try {
      let result;
      if (proof.credential) {
        // Submit event credential
        result = await submitProofToBlockchain(proof.credential);
      } else if (proof.eventId && proof.proofHash) {
        // Submit co-presence proof directly using BlockchainManager
        result = await BlockchainManager.submitProofToBlockchain(proof.eventId, proof.proofHash);
      }
      
      if (result) {
        // Update local proof status
        if (proof.credential) {
          // Update credential status
          proof.credential.blockchainStatus = "Submitted";
        } else {
          // Update co-presence proof status
          const coPresenceProof = coPresenceProofs.find(p => p.eventId === proof.id);
          if (coPresenceProof) {
            coPresenceProof.blockchainStatus = "Submitted";
          }
        }
        console.log('Submitted to blockchain:', result);
      }
    } catch (error) {
      console.error('Failed to submit to blockchain:', error);
    }
  };

  return (
    <div className="p-6 pb-24 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">ZK Proofs</h1>
        <p className="text-muted-foreground">Your zero-knowledge event credentials and blockchain submissions</p>
      </div>

      {/* Blockchain Status */}
      <BlockchainStatus />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-primary/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{displayStats.totalProofs}</div>
            <div className="text-sm text-muted-foreground">Total Proofs</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-secondary/10 border-secondary/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary">{displayStats.eventsAttended}</div>
            <div className="text-sm text-muted-foreground">Events</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-accent/10 border-accent/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-accent">{displayStats.validProofs}</div>
            <div className="text-sm text-muted-foreground">Valid</div>
          </CardContent>
        </Card>
        <Card className="bg-festival-orange/10 border-festival-orange/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-festival-orange">{displayStats.totalRewards}</div>
            <div className="text-sm text-muted-foreground">Rewards</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Button 
          onClick={exportCredentials}
          variant="outline" 
          className="flex-1 border-primary/30 hover:bg-primary/10"
        >
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
        {credentials.length > 0 && (
          <Button 
            onClick={() => verifyCredential(credentials[0])}
            className="flex-1 bg-gradient-accent hover:bg-gradient-secondary"
          >
            <Shield className="w-4 h-4 mr-2" />
            Verify Latest
          </Button>
        )}
      </div>

      {/* Proofs List */}
      <div className="space-y-4">
        {displayProofs.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-32 h-32 mx-auto bg-gradient-primary/20 rounded-xl flex items-center justify-center">
                <Shield className="w-16 h-16 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No proofs yet</h3>
                <p className="text-muted-foreground">
                  Join events and generate your first zero-knowledge proof
                </p>
              </div>
              <Button className="bg-gradient-primary">
                Browse Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          displayProofs.map((proof) => {
            const IconComponent = proof.icon;
            return (
              <Card key={proof.id} className="shadow-card glow-stage hover-scale transition-all duration-300 border-l-4 border-l-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center border border-primary/10">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold">{proof.event}</CardTitle>
                          <p className="text-sm text-muted-foreground">{proof.type}</p>
                        </div>
                      </div>
                      
                      {/* User Masked ID for Co-Presence Proofs */}
                      {proof.type === "Co-Presence Proof" && "maskedUserId" in proof && typeof proof.maskedUserId === "string" && (
                        <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Met with user:</span>
                            <code className="font-mono text-sm text-primary font-medium">{proof.maskedUserId}</code>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {proof.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <span className="bg-muted/50 px-2 py-1 rounded">{proof.location}</span>
                          <span>{proof.date}</span>
                        </div>
                        {proof.status !== "Submitted" && (
                          <div className="text-primary font-medium">
                            +{proof.reward} ZKP
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <Badge 
                        variant="secondary"
                        className={`${getStatusBadgeClass(proof.status)} transition-colors duration-200`}
                      >
                        {proof.status === 'Valid' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {proof.status === 'Submitted' && <Clock className="w-3 h-3 mr-1" />}
                        {proof.status === 'Rewarded' && <Gift className="w-3 h-3 mr-1" />}
                        {proof.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-muted/30 to-muted/10 p-4 rounded-lg border border-border/30">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Proof Hash:</span>
                        <code className="font-mono text-xs bg-background px-2 py-1 rounded border">{proof.proof.slice(0, 16)}...</code>
                      </div>
                      {proof.type === "Co-Presence Proof" && "ephemeralNonce" in proof && typeof proof.ephemeralNonce === "string" && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground font-medium">Session ID:</span>
                          <code className="font-mono text-xs bg-background px-2 py-1 rounded border">{proof.ephemeralNonce.slice(0, 12)}...</code>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm pt-1 border-t border-border/30">
                        <span className="text-muted-foreground font-medium">Status:</span>
                        <span className="text-xs font-semibold">{proof.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1 hover:bg-primary/10 hover:border-primary/30 transition-colors">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 hover:bg-secondary/10 hover:border-secondary/30 transition-colors">
                      <Share className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                    {walletConnected && proof.status !== "Submitted" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 hover:bg-accent/10 hover:border-accent/30 transition-colors"
                        onClick={() => handleSubmitToBlockchain(proof)}
                        disabled={isSubmittingToBlockchain}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        {isSubmittingToBlockchain ? 'Submitting...' : 'Submit to Chain'}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="flex-1 hover:bg-accent/10 hover:border-accent/30 transition-colors">
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Claimed Rewards Section */}
      {walletConnected && (
        <div className="space-y-4 mt-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Claimed Rewards</h2>
              <p className="text-muted-foreground">Your minted NFTs from verified proofs</p>
            </div>
            <Button 
              onClick={loadUserNFTs} 
              variant="outline"
              disabled={isLoadingNFTs}
              className="hover:bg-primary/10"
            >
              {isLoadingNFTs ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {isLoadingNFTs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="shadow-card">
                  <CardContent className="p-4 space-y-4">
                    <div className="w-full h-48 bg-muted/50 rounded-lg animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 bg-muted/50 rounded animate-pulse" />
                      <div className="h-3 bg-muted/30 rounded animate-pulse w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userNFTs.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-32 h-32 mx-auto bg-gradient-primary/20 rounded-xl flex items-center justify-center">
                  <Gift className="w-16 h-16 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">No NFT rewards yet</h3>
                  <p className="text-muted-foreground">
                    Submit your proofs to the blockchain to earn NFT rewards
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userNFTs.map((nft) => (
                <Card key={nft.tokenId} className="shadow-card glow-stage hover-scale transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    <img 
                      src={nft.image} 
                      alt={nft.eventName}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-primary/90 text-primary-foreground">
                        #{nft.tokenId}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{nft.eventName}</h3>
                      <p className="text-sm text-muted-foreground">{nft.description}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground font-medium">Attributes:</div>
                      <div className="flex flex-wrap gap-1">
                        {nft.attributes.map((attr, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {attr.trait_type}: {attr.value}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1 hover:bg-primary/10">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 hover:bg-secondary/10">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        OpenSea
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reward Screen */}
      {showRewardScreen && rewardData && (
        <RewardScreen
          isOpen={showRewardScreen}
          onClose={closeRewardScreen}
          eventName={rewardData.eventName}
          nftImage={rewardData.nftImage}
          txHash={rewardData.txHash}
        />
      )}
    </div>
  );
}