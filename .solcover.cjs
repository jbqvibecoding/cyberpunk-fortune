/**
 * solidity-coverage configuration.
 *
 * We focus coverage on contracts that can be tested deterministically in local Hardhat
 * without requiring live Chainlink services.
 */
module.exports = {
  skipFiles: [
    // Advanced/auxiliary modules (out of scope for the demo track)
    "Governence",
    "interfaces",
    "libraries",
    "mocks",
    "NoLossLogic",
    "Staking",

    // Large Chainlink/feature-complete contracts (require external services or extensive harnessing)
    "TexasHoldemAIDuel.sol",
    "MultiplayerPokerTable.sol",

    // Optional platform modules not needed for the demo track coverage target
    "PioneerToken.sol",
    "PlayerRegistry.sol",
    "Referral.sol",
  ],
};
