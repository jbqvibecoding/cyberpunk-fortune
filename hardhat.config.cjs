require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

// Optional plugins (installed in devDependencies)
require("solidity-coverage");
require("hardhat-gas-reporter");

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";
const SEPOLIA_RPC = process.env.VITE_SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    showTimeSpent: true,
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: SEPOLIA_RPC,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
