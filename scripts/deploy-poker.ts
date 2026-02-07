import { ethers } from "hardhat";

/**
 * Deploy TexasHoldemAIDuel to Sepolia
 *
 * Prerequisites:
 *  1. Chainlink VRF Subscription (same or separate from Powerball)
 *  2. Chainlink Functions Subscription at https://functions.chain.link
 *  3. Fund both with LINK on Sepolia
 *
 * Usage:
 *   npx hardhat run scripts/deploy-poker.ts --network sepolia
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying TexasHoldemAIDuel with account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // ── Chainlink config for Sepolia ──
  const VRF_COORDINATOR = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const VRF_KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";

  // Chainlink Functions Router on Sepolia
  const FUNCTIONS_ROUTER = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0";

  const VRF_SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID;
  const FUNCTIONS_SUBSCRIPTION_ID = process.env.FUNCTIONS_SUBSCRIPTION_ID;

  if (!VRF_SUBSCRIPTION_ID) {
    throw new Error("VRF_SUBSCRIPTION_ID not set. Create one at https://vrf.chain.link");
  }
  if (!FUNCTIONS_SUBSCRIPTION_ID) {
    throw new Error("FUNCTIONS_SUBSCRIPTION_ID not set. Create one at https://functions.chain.link");
  }

  const TexasHoldem = await ethers.getContractFactory("TexasHoldemAIDuel");
  const poker = await TexasHoldem.deploy(
    VRF_COORDINATOR,
    BigInt(VRF_SUBSCRIPTION_ID),
    VRF_KEY_HASH,
    FUNCTIONS_ROUTER,
    BigInt(FUNCTIONS_SUBSCRIPTION_ID)
  );

  await poker.waitForDeployment();
  const address = await poker.getAddress();

  console.log("\n✅ TexasHoldemAIDuel deployed to:", address);
  console.log("\n📋 Next steps:");
  console.log(`   1. Add ${address} as a consumer to your VRF Subscription`);
  console.log("      → https://vrf.chain.link");
  console.log(`   2. Add ${address} as a consumer to your Functions Subscription`);
  console.log("      → https://functions.chain.link");
  console.log(`   3. Set VITE_TEXASHOLDEM_ADDRESS=${address} in your .env`);
  console.log("   4. Restart the frontend: npm run dev");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
