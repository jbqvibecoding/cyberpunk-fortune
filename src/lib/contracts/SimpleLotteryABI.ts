/**
 * SimpleLottery contract ABI
 * Matches contracts/simple/SimpleLottery.sol
 */
export const SimpleLotteryABI = [
  // ── Read ──────────────────────────────────────────
  {
    type: 'function',
    name: 'currentRoundId',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ticketPrice',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'nextDrawTime',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'minBet',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'maxBet',
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
    name: 'totalTickets',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'vrfPending',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'vrfRequestId',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRoundInfo',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [
      { name: 'startTime', type: 'uint256' },
      { name: 'drawTime', type: 'uint256' },
      { name: 'winningMainNumbers', type: 'uint8[5]' },
      { name: 'winningPowerball', type: 'uint8' },
      { name: 'prizePool', type: 'uint256' },
      { name: 'ticketCount', type: 'uint256' },
      { name: 'drawn', type: 'bool' },
      { name: 'finalized', type: 'bool' },
      { name: 'commitHash', type: 'bytes32' },
      { name: 'randomnessProof', type: 'bytes32' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPlayerTickets',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'player', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTicketInfo',
    inputs: [{ name: 'ticketId', type: 'uint256' }],
    outputs: [
      { name: 'player', type: 'address' },
      { name: 'mainNumbers', type: 'uint8[5]' },
      { name: 'powerball', type: 'uint8' },
      { name: 'roundId', type: 'uint256' },
      { name: 'claimed', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'calculatePrize',
    inputs: [{ name: 'ticketId', type: 'uint256' }],
    outputs: [
      { name: 'tier', type: 'uint8' },
      { name: 'prize', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pendingWithdrawals',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },

  // ── Write ─────────────────────────────────────────
  {
    type: 'function',
    name: 'buyTicket',
    inputs: [
      { name: 'mainNumbers', type: 'uint8[5]' },
      { name: 'powerball', type: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'buyQuickPick',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'claimPrize',
    inputs: [{ name: 'ticketId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdrawPending',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ── Events ────────────────────────────────────────
  {
    type: 'event',
    name: 'TicketPurchased',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'ticketId', type: 'uint256', indexed: false },
      { name: 'mainNumbers', type: 'uint8[5]', indexed: false },
      { name: 'powerball', type: 'uint8', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DrawRequested',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'requestId', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RandomnessRevealed',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'randomnessProof', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DrawCompleted',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'winningMainNumbers', type: 'uint8[5]', indexed: false },
      { name: 'winningPowerball', type: 'uint8', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PrizeClaimed',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'ticketId', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'tier', type: 'uint8', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RoundStarted',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'drawTime', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'JackpotRollover',
    inputs: [
      { name: 'fromRound', type: 'uint256', indexed: true },
      { name: 'toRound', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'CommitPosted',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'commitHash', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'VRFRetry',
    inputs: [
      { name: 'roundId', type: 'uint256', indexed: true },
      { name: 'newRequestId', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'HouseFeeCollected',
    inputs: [
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WithdrawalExecuted',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;
