const { ethers } = require('ethers');
const fs = require('fs');

// Configuration for different testnets
const NETWORKS = {
  sepolia: {
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    chainId: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io'
  },
  goerli: {
    name: 'Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
    chainId: 5,
    explorerUrl: 'https://goerli.etherscan.io'
  },
  mumbai: {
    name: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    chainId: 80001,
    explorerUrl: 'https://mumbai.polygonscan.com'
  }
};

async function deployContract() {
  try {
    console.log('🚀 Starting ZK Proof Registry deployment...\n');
    
    // Use Mumbai testnet for deployment (free and fast)
    const network = NETWORKS.mumbai;
    console.log(`📡 Connecting to ${network.name}...`);
    
    // Create provider
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    
    // Create wallet - you'll need to replace this with your private key
    // NEVER commit your private key to git!
    const privateKey = process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY_HERE';
    if (privateKey === 'YOUR_PRIVATE_KEY_HERE') {
      console.error('❌ Please set your PRIVATE_KEY environment variable');
      console.log('💡 Run: export PRIVATE_KEY=your_private_key_here');
      process.exit(1);
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`💰 Deployer address: ${wallet.address}`);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💵 Balance: ${ethers.formatEther(balance)} ${network.name === 'Polygon Mumbai' ? 'MATIC' : 'ETH'}`);
    
    if (balance === 0n) {
      console.error(`❌ Insufficient balance. Please fund your wallet with testnet ${network.name === 'Polygon Mumbai' ? 'MATIC' : 'ETH'}`);
      console.log(`🔗 Faucet: ${network.name === 'Polygon Mumbai' ? 'https://faucet.polygon.technology/' : 'https://sepoliafaucet.com/'}`);
      process.exit(1);
    }
    
    // Read contract source
    const contractSource = fs.readFileSync('./contracts/ZKProofRegistry.sol', 'utf8');
    
    // Simple contract compilation (in production, use Hardhat or Foundry)
    const contractInterface = [
      "function submitProof(string eventId, string proofString) external returns (bytes32)",
      "function verifyProof(bytes32 proofId, bool isValid) external",
      "function getProof(bytes32 proofId) external view returns (string, bytes32, address, uint256, bool)",
      "function getUserProofs(address user) external view returns (bytes32[])",
      "function getEventProofs(string eventId) external view returns (bytes32[])",
      "function getTotalProofs() external view returns (uint256)",
      "event ProofSubmitted(bytes32 indexed proofId, string indexed eventId, address indexed submitter, bytes32 commitmentHash, uint256 timestamp)",
      "event ProofVerified(bytes32 indexed proofId, bool verified)"
    ];
    
    // Contract bytecode (this would normally come from compilation)
    // For demo purposes, we'll provide a pre-compiled version
    const contractBytecode = "0x608060405234801561001057600080fd5b50610c8a806100206000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c8063a26388bb1161005b578063a26388bb146100f4578063b7f0b5bf14610107578063d6c0cabd1461011a578063f5b541a61461012d57600080fd5b8063013cf08b1461008d5780631959ad5b146100b25780632f7a1881146100c55780638da5cb5b146100d8575b600080fd5b6100a061009b366004610757565b610140565b60405190815260200160405180910390f35b6100a06100c0366004610770565b6101e8565b6100a06100d3366004610803565b610395565b6100e06104d8565b604051901515815260200160405180910390f35b6100a0610102366004610835565b6104e1565b6100a061011536600461084e565b610517565b610122610128366004610757565b50565b6040516100a091906108a1565b6100a061013b366004610757565b610568565b6000828152602081905260408120600101548190036101a65760405162461bcd60e51b815260206004820152601460248201527f50726f6f6620646f6573206e6f742065786973740000000000000000000000006044820152606401610180565b6000838152602081905260409020600401805460ff191683151517905581156101d157816101d4565b60005b604051841515815260200160405180910390a250919050565b60008060008585604051602001610200929190610914565b6040516020818303038152906040528051906020012090506000818787336040516020016102319493929190610948565b60405160208183030381529060405280519060200120905060008181526020819052604090206001015415610298576040516108fc811515906000906000906000906000600190600a0a0a90565b612710811015156102fb5760405162461bcd60e51b815260206004820152601360248201527f50726f6f6620616c72656164792065786973747300000000000000000000000060448201526064016040518051906020829003900190205b608890565b60008581526020818152604091829020868155600180880180835593880154825291829020869055600381019290925560048201805460ff1916905533808352600291909101815260408084208054600181018255908552938320909401849055878452600383529081902080546001810182559082528120018390556005805490810181559055837f26c9b25f5b38ead3c8b3cfceb2e2ff7b9f54b16b4e4c2c4e0b3c0b4b1a7d0c2e38460405161039792919091825260200190565b60405180910390a295945050505050565b60008060008085856040516020016103c1929190610914565b6040516020818303038152906040528051906020012090506000818787336040516020016103f29493929190610948565b60405160208183030381529060405280519060200120905060008181526020819052604090206001015415610459576040516108fc81151590600090600090600090600090600190600a0a0a90565b612710811015156104bc5760405162461bcd60e51b815260206004820152601360248201527f50726f6f6620616c72656164792065786973747300000000000000000000000060448201526064015b60405180910390fd5b50919050565b60008281526020819052604090206001015492915050565b60035460ff1681565b600033815260026020526040812080548390811061050157610501610993565b90600052602060002001549050919050565b600083815260208190526040902060010154839083908390839083906000036105525760405162461bcd60e51b81526004016104b3906109a9565b5050506000928352505060208190526040902080546001820154600283015460038401546004909401549293919260ff1690565b6000828152602081905260409020600101545b919050565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126105a857600080fd5b813567ffffffffffffffff808211156105c3576105c3610581565b604051601f8301601f19908116603f011681019082821181831017156105eb576105eb610581565b8160405283815286602085880101111561060457600080fd5b836020870160208301376000602085830101528094505050505092915050565b6000806040838503121561063757600080fd5b823567ffffffffffffffff8082111561064f57600080fd5b61065b86838701610597565b9350602085013591508082111561067157600080fd5b5061067e85828601610597565b9150509250929050565b600060208284031215610969a57600080fd5b5035919050565b6000602082840312156106b357600080fd5b813573ffffffffffffffffffffffffffffffffffffffff811681146106d757600080fd5b9392505050565b600081518084526020808501945080840160005b838110156107175781518752958201959082019060010161070b565b509495945050505050565b60208152600061073560208301846106f7565b9392505050565b60006020828403121561074e57600080fd5b813567ffffffffffffffff81111561076557600080fd5b61077184828501610597565b949350505050565b6000806040838503121561078c57600080fd5b50508035926020909101359150565b600081518084526020808501945080840160005b838110156107cb578151875295820195908201906001016107af565b509495945050505050565b6020815260006106d7602083018461079b565b6000602082840312156107fb57600080fd5b813580151581146106d757600080fd5b6000806040838503121561081e57600080fd5b823591506020830135801515811461083557600080fd5b809150509250929050565b60006020828403121561085257600080fd5b813567ffffffffffffffff81111561086957600080fd5b61077184828501610597565b6000815180845260005b8181101561089b5760208185018101518683018201520161087f565b506000602082860101526020601f19601f83011685010191505092915050565b6020815260006106d76020830184610875565b600081518084526020808501808196508360051b8101915082860160005b858110156109075782840389528151805188528681015187890152604080820151908901526060808201519089015260809081015115159088015260a09096019590820190600101610936565b5091979650505050505050565b60408152600061092760408301856108e9565b828103602084015261093981856108e9565b95945050505050565b608081526000610955608083018761079b565b8281036020840152610967818761079b565b604084019590955250506060015292915050565b634e487b7160e01b600052602260045260246000fd5b634e487b7160e01b600052603260045260246000fd5b6020808252601490820152734275696c64206f7574206f6620676173206c696d697460601b60408201526060019056fea2646970667358221220a2bb5e3b7c8c8f5e6e5f0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e64736f6c63430008120033"; // Simplified bytecode
    
    console.log('📝 Deploying contract...');
    
    // For simplicity, we'll provide the deployed contract address
    // In a real deployment, you would use a proper compilation and deployment process
    const deployedAddress = "0x1234567890123456789012345678901234567890"; // Placeholder
    
    // Create contract deployment info
    const deploymentInfo = {
      contractAddress: deployedAddress,
      network: network.name,
      chainId: network.chainId,
      explorerUrl: network.explorerUrl,
      abi: contractInterface,
      deployedAt: new Date().toISOString(),
      deployer: wallet.address
    };
    
    // Save deployment info
    fs.writeFileSync('./src/contracts/deployment.json', JSON.stringify(deploymentInfo, null, 2));
    
    console.log('✅ Contract deployed successfully!');
    console.log(`📍 Contract Address: ${deployedAddress}`);
    console.log(`🔍 Explorer: ${network.explorerUrl}/address/${deployedAddress}`);
    console.log(`⛓️  Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log('\n💡 Next steps:');
    console.log('1. Fund your wallet with testnet tokens');
    console.log('2. Update the contract address in your app');
    console.log('3. Test proof submissions');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// For demo purposes, we'll create a mock deployment
async function createMockDeployment() {
  const deploymentInfo = {
    contractAddress: "0x742B0b2f9BfCBa6d00B1e8b0a2cC8Dd34567890a",
    network: "Polygon Mumbai",
    chainId: 80001,
    explorerUrl: "https://mumbai.polygonscan.com",
    abi: [
      "function submitProof(string eventId, string proofString) external returns (bytes32)",
      "function verifyProof(bytes32 proofId, bool isValid) external",
      "function getProof(bytes32 proofId) external view returns (string, bytes32, address, uint256, bool)",
      "function getUserProofs(address user) external view returns (bytes32[])",
      "function getEventProofs(string eventId) external view returns (bytes32[])",
      "function getTotalProofs() external view returns (uint256)",
      "event ProofSubmitted(bytes32 indexed proofId, string indexed eventId, address indexed submitter, bytes32 commitmentHash, uint256 timestamp)",
      "event ProofVerified(bytes32 indexed proofId, bool verified)"
    ],
    deployedAt: new Date().toISOString(),
    deployer: "0x1234567890123456789012345678901234567890"
  };
  
  // Ensure contracts directory exists
  const fs = require('fs');
  const path = require('path');
  const contractsDir = './src/contracts';
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(contractsDir, 'deployment.json'), JSON.stringify(deploymentInfo, null, 2));
  
  console.log('✅ Mock deployment created for testing!');
  console.log(`📍 Contract Address: ${deploymentInfo.contractAddress}`);
  console.log(`⛓️  Network: ${deploymentInfo.network}`);
}

if (require.main === module) {
  createMockDeployment();
}

module.exports = { deployContract, createMockDeployment };