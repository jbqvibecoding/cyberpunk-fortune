import { expect } from "chai";
import { ethers } from "hardhat";
import fc from "fast-check";

function toUint8Array5(nums: number[]): [number, number, number, number, number] {
  if (nums.length !== 5) throw new Error("Expected 5 numbers");
  return [nums[0], nums[1], nums[2], nums[3], nums[4]];
}

describe("Fuzzing - SimpleLottery", function () {
  it("accepts valid tickets and rejects invalid ranges/duplicates", async function () {
    const [owner, user] = await ethers.getSigners();
    const SimpleLottery = await ethers.getContractFactory("SimpleLottery");
    const lottery: any = await SimpleLottery.connect(owner).deploy();
    await lottery.deployed();

    const bet = await lottery.ticketPrice();

    // Keep the run count reasonable for CI / Windows.
    await fc.assert(
      fc.asyncProperty(
        // Either generate a valid unique set, or an arbitrary set that might be invalid.
        fc.oneof(
          fc
            .uniqueArray(fc.integer({ min: 1, max: 69 }), { minLength: 5, maxLength: 5 })
            .map((arr: number[]) => ({ kind: "valid" as const, main: arr })),
          fc
            .array(fc.integer({ min: 0, max: 80 }), { minLength: 5, maxLength: 5 })
            .map((arr: number[]) => ({ kind: "maybeInvalid" as const, main: arr }))
        ),
        fc.integer({ min: 0, max: 40 }),
        async (mainCase: { kind: "valid" | "maybeInvalid"; main: number[] }, powerball: number) => {
          const main = mainCase.main;
          const mainNums = toUint8Array5(main);

          const isInRange = main.every((n: number) => n >= 1 && n <= 69);
          const isUnique = new Set(main).size === 5;
          const pbInRange = powerball >= 1 && powerball <= 26;
          const shouldSucceed = isInRange && isUnique && pbInRange;

          if (shouldSucceed) {
            await expect(
              lottery.connect(user).buyTicket(mainNums, powerball, { value: bet })
            ).to.not.be.reverted;
          } else {
            await expect(
              lottery.connect(user).buyTicket(mainNums, powerball, { value: bet })
            ).to.be.reverted;
          }
        }
      ),
      { numRuns: 60 }
    );
  });
});
