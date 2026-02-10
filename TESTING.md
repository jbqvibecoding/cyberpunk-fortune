# Testing Plan and How-to

This document describes how to run unit, integration, fuzzing, and gas tests for the Cyberpunk Fortune project. It also sets expectations for coverage and test categories.

## Requirements

- Code line coverage must be >= 80% (for Solidity contracts and TypeScript where applicable).
- Tests must include:
  - Unit tests (Solidity + frontend unit tests)
  - Integration tests (contract interactions)
  - Fuzzing (Foundry / Echidna recommended)
  - Gas profiling / optimization tests

## Quick setup

1. Install dependencies:

```bash
npm install
npx hardhat compile
```

2. Run frontend unit tests (vitest):

```bash
npm run test
# or
npm run test:watch
```

3. Run Solidity tests (Hardhat):

```bash
npm run test:solidity
```

## Unit Tests (Solidity)

Place unit tests under `test/` using Hardhat + ethers. Example test for `GameNFT` is provided in `test/GameNFT.test.ts`.

Run:

```bash
npm run test:solidity
```

Expectations:
- Cover core behaviors: minting, ownership checks, transfer, edge cases.

## Integration Tests

Integration tests should cover multi-contract flows such as:
- Buy ticket (SimpleLottery) while holding GameNFT — verify play mode gating.
- Referral registration (GameReferral) + reward flows.

Place these tests under `test/integration/`.

Run with the same Hardhat test command.

## Fuzzing

Use Foundry (`forge`) or Echidna for fuzz testing. Recommended approach:

1. Install Foundry (https://getfoundry.sh/) and run `forge test --fuzz` with target properties.
2. For Echidna, write invariant checks and run `echidna-test` against your compiled contracts.

Example fuzz targets:
- `mintPass` should never allow twice for same address/type.
- Prize distribution invariants: total payouts <= contract balance.

Important: Fuzzing requires a native toolchain (Foundry/Echidna). See their docs for setup.

## Gas Tests and Profiling

Use one of these tools:
- `hardhat-gas-reporter` plugin (via `hardhat` + `eth-gas-reporter`) to print gas per test.
- `forge` reports gas usage under Foundry.

Example:

```bash
# with env var to enable gas reporter
REPORT_GAS=true npx hardhat test
```

Measure function gas and then iterate on contract code to reduce storage writes and external calls.

## Coverage

Use `solidity-coverage` for solidity coverage and `vitest --coverage` for frontend. Example commands:

```bash
npx hardhat coverage
npm run test -- --coverage
```

Note: installing `solidity-coverage` may require additional plugin setup in `hardhat.config.cjs`.

## CI Recommendations

- Run `npx hardhat test` and `npx hardhat coverage` in CI.
- Run `vitest` and measure frontend coverage.
- Include a step to run Foundry fuzzing nightly.

## Example test files

- `test/GameNFT.test.ts`: simple unit tests for minting and reset behaviour
- `test/gas/Gas.test.ts`: measures gas usage for mintPass and other critical ops

If you want, I can run tests locally and iterate until coverage ≥ 80%.
