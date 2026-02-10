import { expect } from "chai";
import { ethers } from "hardhat";

function computeCyberPowerballWinning(
  randomWords: bigint[]
): { main: [number, number, number, number, number]; powerball: number } {
  const used = new Set<number>();
  const main: number[] = [];

  for (let i = 0; i < 5; i++) {
    let seed = randomWords[i];
    while (true) {
      const num = Number((seed % 69n) + 1n);
      if (!used.has(num)) {
        used.add(num);
        main.push(num);
        break;
      }
      seed = BigInt(ethers.solidityPackedKeccak256(["uint256"], [seed]));
    }
  }

  main.sort((a, b) => a - b);
  const powerball = Number((randomWords[5] % 26n) + 1n);
  return { main: [main[0], main[1], main[2], main[3], main[4]], powerball };
}

describe("CyberPowerball", function () {
  it("local flow: buy -> upkeep -> VRF fulfill -> claim -> withdraw", async function () {
    const [owner, player] = await ethers.getSigners();

    const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinator");
    const vrf: any = await MockVRFCoordinator.connect(owner).deploy();
    await vrf.deployed();

    const CyberPowerball = await ethers.getContractFactory("CyberPowerball");
    const game: any = await CyberPowerball.connect(owner).deploy(
      await vrf.getAddress(),
      1, // subscriptionId
      ethers.keccak256(ethers.toUtf8Bytes("keyHash"))
    );
    await game.deployed();

    // Ensure contract has enough to pay jackpots in tests.
    await owner.sendTransaction({ to: await game.getAddress(), value: ethers.parseEther("5") });

    const ticketPrice = await game.ticketPrice();

    const randomWords = [1n, 2n, 3n, 4n, 5n, 6n];
    const winning = computeCyberPowerballWinning(randomWords);

    await expect(game.connect(player).buyTicket(winning.main, winning.powerball, { value: ticketPrice }))
      .to.emit(game, "TicketPurchased");

    // Make upkeep eligible
    await ethers.provider.send("evm_increaseTime", [Number(await game.drawInterval()) + 1]);
    await ethers.provider.send("evm_mine", []);

    const check = await game.checkUpkeep.staticCall("0x");
    expect(check[0]).to.eq(true);

    const upkeepTx = await game.performUpkeep("0x");
    const upkeepReceipt = await upkeepTx.wait();

    const requestEvent = upkeepReceipt!.logs
      .map((log: any) => {
        try {
          return game.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed: any) => parsed?.name === "DrawRequested");

    expect(requestEvent).to.not.eq(undefined);
    const requestId = requestEvent!.args.requestId as bigint;

    await expect(vrf.connect(owner).fulfillRandomWords(requestId, randomWords))
      .to.emit(game, "DrawCompleted");

    // If winner exists, claim should succeed for ticket 0.
    await expect(game.connect(player).claimPrize(0)).to.emit(game, "PrizeClaimed");

    // Exercise pull-payment withdrawal path.
    await expect(game.connect(player).withdrawPending()).to.emit(game, "WithdrawalExecuted");
  });
});
