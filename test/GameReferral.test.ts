import { expect } from "chai";
import { ethers } from "hardhat";

describe("GameReferral", function () {
  it("registers referrer and applies referral rewards", async function () {
    const [owner, referrer, player] = await ethers.getSigners();
    const GameReferral = await ethers.getContractFactory("GameReferral");
    const referral: any = await GameReferral.connect(owner).deploy();
    await referral.deployed();

    await expect(referral.connect(referrer).registerAsReferrer())
      .to.emit(referral, "ReferrerRegistered")
      .withArgs(referrer.address, await referral.myReferralCode(referrer.address));

    const code = await referral.myReferralCode(referrer.address);
    expect(code).to.not.eq(ethers.ZeroHash);

    const referrerPointsBefore = await referral.rewardPoints(referrer.address);

    await expect(referral.connect(player).registerWithReferral(code))
      .to.emit(referral, "ReferralUsed")
      .withArgs(player.address, referrer.address, code);

    const referrerPointsAfter = await referral.rewardPoints(referrer.address);
    expect(referrerPointsAfter).to.be.gt(referrerPointsBefore);

    // New user welcome bonus
    const playerPoints = await referral.rewardPoints(player.address);
    expect(playerPoints).to.be.gte(50n);

    // Player gets their own referral code
    const playerCode = await referral.myReferralCode(player.address);
    expect(playerCode).to.not.eq(ethers.ZeroHash);
  });
});
