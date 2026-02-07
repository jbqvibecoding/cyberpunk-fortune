/**
 * Deployed contract addresses on Sepolia testnet.
 *
 * ===== INSTRUCTIONS =====
 * After deploying via Remix, paste the deployed addresses below
 * OR set them as environment variables in a .env file:
 *
 *   VITE_SIMPLE_LOTTERY_ADDRESS=0x...
 *   VITE_SIMPLE_POKER_ADDRESS=0x...
 *   VITE_GAME_NFT_ADDRESS=0x...
 *   VITE_GAME_REFERRAL_ADDRESS=0x...
 */
export const CONTRACTS = {
  SimpleLottery: (import.meta.env.VITE_SIMPLE_LOTTERY_ADDRESS ||
    '0xd4e1dc41a69d8c3f502083a0a28556b949c083d9') as `0x${string}`,

  SimplePoker: (import.meta.env.VITE_SIMPLE_POKER_ADDRESS ||
    '0xf0054591ac2115c4dee46d855b9d60f238b0e76c') as `0x${string}`,

  GameNFT: (import.meta.env.VITE_GAME_NFT_ADDRESS ||
    '0x5fa904c4e393a8e4c51b719806fd586376ad8b41') as `0x${string}`,

  GameReferral: (import.meta.env.VITE_GAME_REFERRAL_ADDRESS ||
    '0x34a51bf72382c17b3ba990f480b2b676845b1986') as `0x${string}`,
} as const;

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;
