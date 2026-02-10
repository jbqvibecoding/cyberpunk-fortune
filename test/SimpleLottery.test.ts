import { expect } from "chai";
import { ethers } from "hardhat";

function uniq5Sorted(values: number[]): [number, number, number, number, number] {
  const uniq = Array.from(new Set(values));
  if (uniq.length !== 5) throw new Error("Expected 5 unique numbers");
  uniq.sort((a, b) => a - b);
  return [uniq[0], uniq[1], uniq[2], uniq[3], uniq[4]];
}

async function increaseTime(seconds: number) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

function computeWinningNumbers(seed: string): { main: [number, number, number, number, number]; powerball: number } {
  const randomVal = BigInt(seed);
  const used = new Set<number>();
  const main: number[] = [];

  for (let i = 0; i < 5; i++) {
    let s = BigInt(
      ethers.solidityPackedKeccak256(["uint256", "uint256"], [randomVal, BigInt(i)])
    );

    while (true) {
      const num = Number((s % 69n) + 1n);
      if (!used.has(num)) {
        used.add(num);
        main.push(num);
        break;
      }
      s = BigInt(ethers.solidityPackedKeccak256(["uint256"], [s]));
    }
  }

  const powerball = Number(
    (BigInt(ethers.solidityPackedKeccak256(["uint256", "uint256"], [randomVal, 5n])) % 26n) + 1n
  );
  return { main: uniq5Sorted(main), powerball };
}

describe("SimpleLottery", function () {
  it("runs a full round: buy -> commit -> reveal -> claim", async function () {
    const [owner, user] = await ethers.getSigners();
    const SimpleLottery = await ethers.getContractFactory("SimpleLottery");
    const lottery: any = await SimpleLottery.connect(owner).deploy();
    await lottery.deployed();

    const bet = await lottery.ticketPrice();

    const seed = ethers.keccak256(ethers.toUtf8Bytes("deterministic-seed-1"));
    const commitHash = ethers.solidityPackedKeccak256(["bytes32"], [seed]);
    const winning = computeWinningNumbers(seed);

    await expect(
      lottery.connect(user).buyTicket(winning.main, winning.powerball, { value: bet })
    ).to.emit(lottery, "TicketPurchased");

    const nextDrawTime = await lottery.nextDrawTime();
    const now = (await ethers.provider.getBlock("latest"))!.timestamp;
    const delta = Number(nextDrawTime) - now;
    if (delta > 0) await increaseTime(delta + 1);

    await expect(lottery.connect(owner).commitDraw(commitHash))
      .to.emit(lottery, "CommitPosted")
      .withArgs(await lottery.currentRoundId(), commitHash);

    await expect(lottery.connect(owner).revealDraw(seed))
      .to.emit(lottery, "DrawCompleted")
      .withArgs(await lottery.currentRoundId(), winning.main, winning.powerball);

    await expect(lottery.connect(user).claimPrize(0)).to.emit(lottery, "PrizeClaimed");

    await expect(lottery.connect(user).withdrawPending()).to.emit(lottery, "WithdrawalExecuted");
  });

  it("rejects invalid ticket inputs", async function () {
    const [owner, user] = await ethers.getSigners();
    const SimpleLottery = await ethers.getContractFactory("SimpleLottery");
    const lottery: any = await SimpleLottery.connect(owner).deploy();
    await lottery.deployed();

    const bet = await lottery.ticketPrice();

    await expect(
      lottery.connect(user).buyTicket([1, 2, 3, 4, 4], 10, { value: bet })
    ).to.be.reverted;

    await expect(
      lottery.connect(user).buyTicket([1, 2, 3, 4, 70], 10, { value: bet })
    ).to.be.reverted;

    await expect(
      lottery.connect(user).buyTicket([1, 2, 3, 4, 5], 0, { value: bet })
    ).to.be.reverted;

    await expect(lottery.connect(user).commitDraw(ethers.keccak256(ethers.toUtf8Bytes("x")))).to.be.reverted;
  });
});
