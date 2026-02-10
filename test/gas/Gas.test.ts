import { expect } from "chai";
import { ethers } from "hardhat";

describe("Gas profiling - GameNFT", function () {
  it("measures gas for mintPass", async function () {
    const [owner, user] = await ethers.getSigners();
    const GameNFT = await ethers.getContractFactory("GameNFT");
    const nft = await GameNFT.connect(owner).deploy();
    await nft.deployed();

    const tx = await nft.connect(user).mintPass(0);
    const rc = await tx.wait();
    const gasUsed = rc.gasUsed.toNumber();
    console.log("mintPass gasUsed:", gasUsed);
    expect(gasUsed).to.be.a('number');
  });
});
