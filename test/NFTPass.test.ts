import { expect } from "chai";
import { ethers } from "hardhat";

describe("NFTPass", function () {
  it("owner can mint; non-owner cannot; tokenURI is set", async function () {
    const [owner, user] = await ethers.getSigners();
    const NFTPass = await ethers.getContractFactory("NFTPass");
    const pass = await NFTPass.connect(owner).deploy("Pioneer Pass", "PASS");
    await pass.deployed();

    await expect(pass.connect(user).mintPass(user.address, "ipfs://token-1")).to.be.reverted;

    await expect(pass.connect(owner).mintPass(user.address, "ipfs://token-1"))
      .to.emit(pass, "Transfer")
      .withArgs(ethers.ZeroAddress, user.address, 1);

    expect(await pass.ownerOf(1)).to.eq(user.address);
    expect(await pass.tokenURI(1)).to.eq("ipfs://token-1");
  });
});
