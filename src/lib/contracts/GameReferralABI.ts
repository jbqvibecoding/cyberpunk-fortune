/**
 * GameReferral contract ABI
 * Matches contracts/simple/GameReferral.sol
 */
export const GameReferralABI = [
  // ── Read ──────────────────────────────────────────
  {
    type: 'function',
    name: 'totalReferrers',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalReferrals',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isRegistered',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'myReferralCode',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'rewardPoints',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMyInfo',
    inputs: [{ name: '_addr', type: 'address' }],
    outputs: [
      { name: 'referralCode', type: 'bytes32' },
      { name: 'points', type: 'uint256' },
      { name: 'referralCount', type: 'uint256' },
      { name: 'tier', type: 'uint256' },
      { name: 'tierName', type: 'string' },
      { name: 'registered', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getReferrerInfo',
    inputs: [{ name: 'code', type: 'bytes32' }],
    outputs: [
      { name: 'wallet', type: 'address' },
      { name: 'referralCount', type: 'uint256' },
      { name: 'totalRewards', type: 'uint256' },
      { name: 'tier', type: 'uint256' },
      { name: 'tierName', type: 'string' },
      { name: 'registeredAt', type: 'uint256' },
    ],
    stateMutability: 'view',
  },

  // ── Write ─────────────────────────────────────────
  {
    type: 'function',
    name: 'registerAsReferrer',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'registerWithReferral',
    inputs: [{ name: '_referralCode', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Events ────────────────────────────────────────
  {
    type: 'event',
    name: 'ReferrerRegistered',
    inputs: [
      { name: 'wallet', type: 'address', indexed: true },
      { name: 'referralCode', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ReferralUsed',
    inputs: [
      { name: 'newUser', type: 'address', indexed: true },
      { name: 'referrer', type: 'address', indexed: true },
      { name: 'referralCode', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RewardEarned',
    inputs: [
      { name: 'referrer', type: 'address', indexed: true },
      { name: 'points', type: 'uint256', indexed: false },
      { name: 'newTotal', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TierUpgrade',
    inputs: [
      { name: 'referrer', type: 'address', indexed: true },
      { name: 'newTier', type: 'uint256', indexed: false },
      { name: 'tierName', type: 'string', indexed: false },
    ],
  },
] as const;
