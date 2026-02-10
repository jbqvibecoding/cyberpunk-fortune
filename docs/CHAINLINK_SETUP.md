# Chainlink Setup Guide

This document explains how to configure the three Chainlink services used by Pioneer on the Sepolia testnet.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Chainlink VRF v2 — verifiable randomness](#2-chainlink-vrf-v2--verifiable-randomness)
3. [Chainlink Automation — scheduled execution](#3-chainlink-automation--scheduled-execution)
4. [Chainlink Functions — AI decisions](#4-chainlink-functions--ai-decisions)
5. [Service matrix by contract](#5-service-matrix-by-contract)
6. [Cost estimates](#6-cost-estimates)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

### 1.1 Get Sepolia ETH

- Faucets: https://sepoliafaucet.com/ or https://www.alchemy.com/faucets/ethereum-sepolia
- Suggested: at least **0.5 Sepolia ETH**

### 1.2 Get Sepolia LINK

- Faucet: https://faucets.chain.link/sepolia
- Typically you can claim **25 LINK** per request
- Suggested: at least **50 LINK** (VRF + Functions + Automation)

### 1.3 Key addresses (Sepolia)

| Service | Address |
|------|---------|
| VRF Coordinator v2 | `0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625` |
| VRF Key Hash (200 gwei lane) | `0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c` |
| LINK token | `0x779877A7B0D9E8603169DdbD7836e478b4624789` |
| Functions router | `0xb83E47C2bC239B3bf370bc41e1459A34b41238D0` |
| Automation registry | Managed via https://automation.chain.link |

---

## 2. Chainlink VRF v2 — verifiable randomness

**Used for:** CyberPowerball draws, TexasHoldem card dealing, MultiplayerPokerTable shuffling

### 2.1 Create a VRF subscription

1. Open https://vrf.chain.link
2. Connect your **deployer wallet** (MetaMask)
3. Switch to **Sepolia**
4. Click **Create Subscription**
5. Confirm and record the **Subscription ID** (e.g. `12345`)

### 2.2 Fund the subscription with LINK

1. Open your subscription
2. Click **Fund Subscription**
3. Fund with **10 LINK** (usually enough for testing)
4. Confirm

### 2.3 Add consumer contracts

After deploying contracts, add them as VRF consumers:

1. Click **Add Consumer**
2. Paste the **CyberPowerball** address and confirm
3. Click **Add Consumer** again
4. Paste the **TexasHoldemAIDuel** address and confirm

⚠️ If you don't add the consumer, VRF requests will revert.

### 2.4 VRF parameters

| Parameter | CyberPowerball | TexasHoldemAIDuel |
|------|---------------|------------------|
| numWords | 6 (5 main + 1 powerball) | 9 (2 player + 2 AI + 5 community) |
| callbackGasLimit | 500,000 | 500,000 |
| requestConfirmations | 3 | 3 |
| keyHash | 200 gwei lane | 200 gwei lane |

---

## 3. Chainlink Automation — scheduled execution

**Used for:** triggering CyberPowerball scheduled draws automatically.

### 3.1 How it works

CyberPowerball implements `AutomationCompatibleInterface`:

- `checkUpkeep()` — called periodically to decide whether upkeep is needed
- `performUpkeep()` — executed when needed; requests VRF randomness and starts the draw

### 3.2 Register an upkeep

1. Open https://automation.chain.link
2. Connect the deployer wallet and switch to Sepolia
3. Click **Register New Upkeep**
4. Choose **Custom logic**
5. Fill in:

| Field | Value |
|------|-----|
| Target contract address | `<your CyberPowerball address>` |
| Upkeep name | `Pioneer Powerball Draw` |
| Gas limit | `750000` (must cover performUpkeep + VRF request) |
| Starting balance | `5 LINK` |
| Check data | `0x` |

6. Confirm the transaction to complete registration

### 3.3 Verify Automation

After registration, on the Automation dashboard you should see:

- **Status**: Active
- **Last performed**: updates after the next scheduled draw
- **Balance**: your funded LINK balance

If it doesn't trigger for a long time, check:
- `checkUpkeep()` returns `upkeepNeeded == true`
- At least one ticket exists (e.g. `totalTickets > 0`)
- `nextDrawTime` is in the past

### 3.4 Manually trigger for testing

During testing, you can call `performUpkeep` manually from the Hardhat console:

```bash
npx hardhat console --network sepolia
```

```javascript
const powerball = await ethers.getContractAt("CyberPowerball", "<CONTRACT_ADDRESS>");
const [upkeepNeeded, performData] = await powerball.checkUpkeep("0x");
console.log("Upkeep needed:", upkeepNeeded);
if (upkeepNeeded) {
  const tx = await powerball.performUpkeep(performData);
  await tx.wait();
  console.log("Draw triggered!");
}
```

---

## 4. Chainlink Functions — AI decisions

**Used for:** AI opponent decisions in TexasHoldemAIDuel (off-chain LLM calls)

⚠️ **Current status:** AI decisions currently use an **on-chain simulation** (`_simulateAIDecision`).
The Chainlink Functions callback `_fulfillRequest` is present but effectively a no-op.
To integrate a real LLM (e.g., OpenAI), you must implement `_requestAIDecision` and parse results in `_fulfillRequest`.

### 4.1 Create a Functions subscription

1. Open https://functions.chain.link
2. Connect the deployer wallet and switch to Sepolia
3. Click **Create Subscription**
4. Confirm and record the **Subscription ID**

### 4.2 Fund with LINK

1. Open the subscription details and click **Fund**
2. Fund with **5 LINK**
3. Confirm

### 4.3 Add a consumer

1. Click **Add Consumer**
2. Paste the **TexasHoldemAIDuel** contract address
3. Confirm

### 4.4 Steps to enable a real LLM later

To make the AI use the real OpenAI API:

1. Implement `_requestAIDecision()` to call `_sendRequest()`
2. Parse the LLM response in `_fulfillRequest()`
3. Upload the OpenAI API key via the Chainlink Functions **Secrets Manager**
4. The Functions JavaScript source must make an HTTP request to OpenAI

```javascript
// Example Functions source (runs off-chain and returns on-chain)
const prompt = args[0]; // AI prompt from contract
const response = await Functions.makeHttpRequest({
  url: "https://api.openai.com/v1/chat/completions",
  method: "POST",
  headers: { "Authorization": `Bearer ${secrets.OPENAI_API_KEY}` },
  data: {
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 50,
  },
});
return Functions.encodeString(response.data.choices[0].message.content);
```

---

## 5. Service matrix by contract

| Contract | VRF v2 | Automation | Functions |
|------|:------:|:----------:|:---------:|
| **CyberPowerball** | ✅ 6 words | ✅ scheduled draws | ❌ |
| **TexasHoldemAIDuel** | ✅ 9 words | ❌ | ✅ AI decisions (stubbed) |
| **MultiplayerPokerTable** | ✅ 1 word | ❌ | ❌ |

### Full configuration checklist

After deployment, ensure all of the following are completed:

- [ ] VRF subscription created and funded (>= 10 LINK)
- [ ] CyberPowerball added as VRF consumer
- [ ] TexasHoldemAIDuel added as VRF consumer
- [ ] Automation upkeep registered (targets CyberPowerball) and funded (>= 5 LINK)
- [ ] Functions subscription created and funded (>= 5 LINK)
- [ ] TexasHoldemAIDuel added as Functions consumer
- [ ] `.env` contains correct deployed addresses

---

## 6. Cost estimates

| Service | Cost per call (LINK) | Test frequency | Monthly estimate |
|------|:------------------:|---------|--------|
| VRF (Powerball, 6 words) | ~0.25 | once per day | ~7.5 LINK |
| VRF (Poker, 9 words) | ~0.35 | per hand | depends on usage |
| Automation (performUpkeep) | ~0.1 | once per day | ~3 LINK |
| Functions (AI decisions) | ~0.2 | currently not enabled | 0 |

Note: Sepolia LINK is free (testnet); these numbers are for mainnet-style intuition only.

---

## 7. Troubleshooting

### VRF request has no callback

| Possible cause | Fix |
|---------|---------|
| Contract not added as consumer | Add it in vrf.chain.link |
| Subscription LINK balance too low | Fund with more LINK |
| callbackGasLimit too low | Increase via `setVRFConfig()` (CyberPowerball only) |
| Network congestion | Wait or increase gas |

### Automation does not trigger

| Possible cause | Fix |
|---------|---------|
| checkUpkeep returns false | Ensure time passed and at least one ticket sold |
| Upkeep LINK balance too low | Fund with more LINK |
| Gas limit too low | Increase in the Automation dashboard |
| Contract paused | Check the contract `paused` state |

### Functions callback fails

| Possible cause | Fix |
|---------|---------|
| Still using simulation mode | Contract uses `_simulateAIDecision`; Functions not invoked |
| Consumer not registered | Add it in functions.chain.link |
| Source execution timeout | Simplify the JS source or increase gasLimit |
