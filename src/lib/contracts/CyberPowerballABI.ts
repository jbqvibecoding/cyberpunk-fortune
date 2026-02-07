/**
 * CyberPowerball contract ABI (subset – covers all user-facing functions & events)
 *
 * Generated from contracts/CyberPowerball.sol
 * After a Hardhat compile you can replace this with the full ABI from
 *   artifacts/contracts/CyberPowerball.sol/CyberPowerball.json
 */
export const CyberPowerballABI = [
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
] as const;
