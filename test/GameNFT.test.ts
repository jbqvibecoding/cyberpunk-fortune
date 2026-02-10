import { expect } from "chai";
import { ethers } from "hardhat";

describe("GameNFT", function () {
  it("allows minting passes and resetting minted status by owner", async function () {
    const [owner, user] = await ethers.getSigners();
    const GameNFT = await ethers.getContractFactory("GameNFT");
    const nft = await GameNFT.connect(owner).deploy();
    await nft.deployed();

    // user mints NoLoss (type 1)
    await nft.connect(user).mintPass(1);
    expect(await nft.hasNFTType(user.address, 1)).to.equal(true);
    expect(await nft.hasMintedType(user.address, 1)).to.equal(true);

    // owner can reset minted flag
    await nft.connect(owner).resetMintedType(user.address, 1);
    expect(await nft.hasMintedType(user.address, 1)).to.equal(false);

    // after reset user can mint again
    await nft.connect(user).mintPass(1);
    expect(await nft.hasNFTType(user.address, 1)).to.equal(true);
  });
});
