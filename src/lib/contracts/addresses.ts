/**
 * Deployed contract addresses on Sepolia testnet.
 *
 * After deploying with Hardhat / Foundry, paste the addresses here.
 * These are also overridable via environment variables so that
 * different environments (staging / prod) can use their own deployments.
 */
export const CONTRACTS = {
  CyberPowerball: (import.meta.env.VITE_CYBERPOWERBALL_ADDRESS ||
    '0x0000000000000000000000000000000000000000') as `0x${string}`,

  TexasHoldemAIDuel: (import.meta.env.VITE_TEXASHOLDEM_ADDRESS ||
    '0x0000000000000000000000000000000000000000') as `0x${string}`,
} as const;

/**
 * Sepolia Chainlink infrastructure addresses (for reference / deployment scripts)
 */
export const CHAINLINK_SEPOLIA = {
  VRF_COORDINATOR: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
  KEY_HASH: '0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c',
  LINK_TOKEN: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
} as const;
