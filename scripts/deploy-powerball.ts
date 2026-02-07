import { ethers } from "hardhat";

/**
 * Deploy CyberPowerball to Sepolia
 *
 * Prerequisites:
 *  1. Create a Chainlink VRF Subscription at https://vrf.chain.link
 *  2. Fund it with LINK on Sepolia
 *  3. Set the env vars below (or in .env)
 *
 * Usage:
 *   npx hardhat run scripts/deploy-powerball.ts --network sepolia
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying CyberPowerball with account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // ── Chainlink VRF v2 config for Sepolia ──
  const VRF_COORDINATOR = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";

  // The subscription ID from https://vrf.chain.link (Sepolia)
  const SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID;
  if (!SUBSCRIPTION_ID) {
    throw new Error(
      "VRF_SUBSCRIPTION_ID not set. Create one at https://vrf.chain.link and add it to .env"
    );
  }

  const CyberPowerball = await ethers.getContractFactory("CyberPowerball");
  const powerball = await CyberPowerball.deploy(
    VRF_COORDINATOR,
    BigInt(SUBSCRIPTION_ID),
    KEY_HASH
  );

  await powerball.waitForDeployment();
  const address = await powerball.getAddress();

  console.log("\n✅ CyberPowerball deployed to:", address);
  console.log("\n📋 Next steps:");
  console.log(`   1. Add ${address} as a consumer to your VRF Subscription`);
  console.log("      → https://vrf.chain.link");
  console.log("   2. Register Chainlink Automation upkeep for scheduled draws");
  console.log("      → https://automation.chain.link");
  console.log(`   3. Set VITE_CYBERPOWERBALL_ADDRESS=${address} in your .env`);
  console.log("   4. Restart the frontend: npm run dev");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
