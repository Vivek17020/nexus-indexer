const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying ZKProofRegistry to Polygon zkEVM testnet...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");

  if (balance.lt(ethers.utils.parseEther("0.01"))) {
    console.warn("⚠️  Low balance! You may need testnet ETH from faucet:");
    console.warn("   https://bridge.zkevm.polygonscan.com/");
  }

  // Deploy contract
  const ZKProofRegistry = await ethers.getContractFactory("ZKProofRegistry");
  
  // Constructor parameters
  const name = "ZK Proof Attendance NFT";
  const symbol = "ZKPAN";
  const baseTokenURI = "https://api.zkproof.nexus/metadata/";
  
  console.log("⏳ Deploying contract...");
  const registry = await ZKProofRegistry.deploy(name, symbol, baseTokenURI);
  
  console.log("⏳ Waiting for deployment confirmation...");
  await registry.deployed();
  
  console.log("✅ ZKProofRegistry deployed to:", registry.address);
  console.log("🔍 Transaction hash:", registry.deployTransaction.hash);
  
  // Wait for a few confirmations
  console.log("⏳ Waiting for confirmations...");
  await registry.deployTransaction.wait(2);
  
  // Set up some sample event metadata
  console.log("📝 Setting up sample event metadata...");
  
  const sampleEvents = [
    {
      eventId: "eth-denver-2025",
      eventName: "ETH Denver 2025",
      eventDescription: "Premier Ethereum conference and hackathon",
      imageUri: "https://api.zkproof.nexus/metadata/eth-denver-2025.json",
      location: "Denver, CO",
      eventDate: Math.floor(Date.now() / 1000) + 86400 // Tomorrow
    },
    {
      eventId: "zk-summit-11",
      eventName: "ZK Summit 11",
      eventDescription: "Zero-knowledge cryptography summit",
      imageUri: "https://api.zkproof.nexus/metadata/zk-summit-11.json",
      location: "Berlin, Germany",
      eventDate: Math.floor(Date.now() / 1000) + 172800 // Day after tomorrow
    },
    {
      eventId: "devcon-7",
      eventName: "Devcon 7",
      eventDescription: "Ethereum Developer Conference",
      imageUri: "https://api.zkproof.nexus/metadata/devcon-7.json",
      location: "Bangkok, Thailand",
      eventDate: Math.floor(Date.now() / 1000) + 259200 // 3 days from now
    }
  ];

  for (const event of sampleEvents) {
    try {
      const tx = await registry.setEventMetadata(
        event.eventId,
        event.eventName,
        event.eventDescription,
        event.imageUri,
        event.location,
        event.eventDate
      );
      await tx.wait();
      console.log(`✅ Set metadata for ${event.eventName}`);
    } catch (error) {
      console.warn(`⚠️  Failed to set metadata for ${event.eventName}:`, error.message);
    }
  }

  // Prepare deployment info
  const deploymentInfo = {
    contractAddress: registry.address,
    contractName: "ZKProofRegistry",
    deployerAddress: deployer.address,
    txHash: registry.deployTransaction.hash,
    blockNumber: registry.deployTransaction.blockNumber,
    network: "polygon-zkevm-testnet",
    chainId: 1442,
    explorerUrl: "https://testnet-zkevm.polygonscan.com",
    timestamp: new Date().toISOString(),
    abi: [
      "function submitProof(string eventId, bytes proofData) external returns (uint256)",
      "function getUserProofs(address user) external view returns (uint256[])",
      "function getTotalProofs() external view returns (uint256)",
      "function getTotalNFTs() external view returns (uint256)",
      "function getProof(uint256 proofId) external view returns (bytes32, string, address, uint256, bool, uint256)",
      "function hasValidProofForEvent(address user, string eventId) external view returns (bool)",
      "function setEventMetadata(string eventId, string eventName, string eventDescription, string imageUri, string location, uint256 eventDate) external",
      "function validateProof(uint256 proofId, bool isValid) external",
      "function balanceOf(address owner) external view returns (uint256)",
      "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
      "function tokenURI(uint256 tokenId) external view returns (string)",
      "event ProofSubmitted(uint256 indexed proofId, bytes32 indexed commitment, string eventId, address indexed submitter)",
      "event NFTMinted(uint256 indexed tokenId, uint256 indexed proofId, address indexed recipient, string eventId)",
      "event ProofValidated(uint256 indexed proofId, bool isValid)"
    ]
  };

  // Save deployment info
  const deploymentsDir = path.join(__dirname, '../src/contracts');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentPath = path.join(deploymentsDir, 'deployment.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("💾 Deployment info saved to:", deploymentPath);
  console.log("\n🎉 Deployment Summary:");
  console.log("   Contract Address:", registry.address);
  console.log("   Network: Polygon zkEVM Testnet");
  console.log("   Explorer:", `${deploymentInfo.explorerUrl}/address/${registry.address}`);
  console.log("   Gas Used:", registry.deployTransaction.gasLimit?.toString());
  
  console.log("\n📋 Next Steps:");
  console.log("1. Fund the contract with testnet ETH for operations");
  console.log("2. Verify contract on PolygonScan (optional)");
  console.log("3. Test proof submission and NFT minting");
  console.log("4. Update frontend with new contract address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });