// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTPass is ERC721URIStorage, Ownable {
    uint256 public counter;

    /**
     * @notice Creates an ERC721 pass collection
     * @dev Uses OZ Ownable constructor that requires an initial owner
     */
    constructor(string memory name, string memory symbol) 
        ERC721(name, symbol) 
        Ownable() 
    {}

    /**
     * @notice Mint a pass NFT with a token URI
     * @param to Recipient address
     * @param uri Token URI (e.g., ipfs://...)
     * @return tokenId Newly minted tokenId
     */
    function mintPass(address to, string calldata uri) public onlyOwner returns (uint256) {
        counter++;
        _safeMint(to, counter);
        _setTokenURI(counter, uri);
        return counter;
    }

    /**
     * @notice Batch mint multiple pass NFTs
     * @param to Recipient addresses
     * @param uris Token URIs
     */
    function batchMint(address[] calldata to, string[] calldata uris) external onlyOwner {
        require(to.length == uris.length, "Length mismatch");
        for (uint i = 0; i < to.length; i++) {
            mintPass(to[i], uris[i]);
        }
    }
}