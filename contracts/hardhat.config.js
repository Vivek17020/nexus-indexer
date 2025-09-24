require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

// Replace with your actual private key (use environment variable in production)
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    "polygon-zkevm-testnet": {
      url: "https://rpc.public.zkevm-test.net",
      accounts: [PRIVATE_KEY],
      chainId: 1442,
      gasPrice: 1000000000, // 1 gwei
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};