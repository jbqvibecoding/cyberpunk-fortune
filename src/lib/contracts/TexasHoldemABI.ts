/**
 * TexasHoldemAIDuel contract ABI (subset – covers user-facing functions & events)
 *
 * Generated from contracts/TexasHoldemAIDuel.sol
 * After a Hardhat compile you can replace this with the full ABI from
 *   artifacts/contracts/TexasHoldemAIDuel.sol/TexasHoldemAIDuel.json
 */
export const TexasHoldemABI = [
  // ── Read ──────────────────────────────────────────
  {
    type: 'function',
    name: 'games',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: [
      { name: 'player', type: 'address' },
      { name: 'playerChips', type: 'uint256' },
      { name: 'aiChips', type: 'uint256' },
      { name: 'pot', type: 'uint256' },
      { name: 'currentBet', type: 'uint256' },
      { name: 'playerCurrentBet', type: 'uint256' },
      { name: 'aiCurrentBet', type: 'uint256' },
      { name: 'phase', type: 'uint8' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'activeGame',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'minBuyIn',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'maxBuyIn',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },

  // ── Write ─────────────────────────────────────────
  {
    type: 'function',
    name: 'startGame',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'fold',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'check',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'call',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'raise',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allIn',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cashOut',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimAITimeout',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Events ────────────────────────────────────────
  {
    type: 'event',
    name: 'GameCreated',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'player', type: 'address', indexed: true },
      { name: 'buyIn', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'CardsDealt',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'phase', type: 'uint8', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PlayerActed',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'action', type: 'uint8', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AIActed',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'action', type: 'uint8', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'reasoning', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'HandCompleted',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'playerWon', type: 'bool', indexed: false },
      { name: 'pot', type: 'uint256', indexed: false },
      { name: 'handDescription', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'GameEnded',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'playerWon', type: 'bool', indexed: false },
      { name: 'finalChips', type: 'uint256', indexed: false },
    ],
  },
] as const;
