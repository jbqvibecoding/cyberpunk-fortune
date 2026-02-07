/**
 * SimplePoker contract ABI
 * Matches contracts/simple/SimplePoker.sol
 */
export const SimplePokerABI = [
  // ── Read ──────────────────────────────────────────
  {
    type: 'function',
    name: 'gameCounter',
    inputs: [],
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
  {
    type: 'function',
    name: 'houseFeeBps',
    inputs: [],
    outputs: [{ name: '', type: 'uint16' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'activeGame',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getGameInfo',
    inputs: [{ name: 'gid', type: 'uint256' }],
    outputs: [
      { name: 'player', type: 'address' },
      { name: 'buyIn', type: 'uint256' },
      { name: 'pot', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'playerWon', type: 'bool' },
      { name: 'payout', type: 'uint256' },
      { name: 'handDescription', type: 'string' },
      { name: 'resultHash', type: 'bytes32' },
      { name: 'playerCommit', type: 'bytes32' },
      { name: 'revealDeadline', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPlayerStats',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      { name: 'wins', type: 'uint256' },
      { name: 'losses', type: 'uint256' },
      { name: 'wagered', type: 'uint256' },
    ],
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
    name: 'commitAction',
    inputs: [{ name: '_commitHash', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'revealAction',
    inputs: [{ name: '_seed', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'quickPlay',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'claimTimeout',
    inputs: [{ name: 'gid', type: 'uint256' }],
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
    name: 'PlayerCommitted',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'commitHash', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PlayerRevealed',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'seed', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'GameResult',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'playerWon', type: 'bool', indexed: false },
      { name: 'payout', type: 'uint256', indexed: false },
      { name: 'handDescription', type: 'string', indexed: false },
      { name: 'resultHash', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PenaltyApplied',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'player', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Withdrawal',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;
