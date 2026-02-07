// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PlayerRegistry
 * @notice Lightweight on-chain mapping from address -> ENS name (string). No external ENS verification is enforced here.
 */
contract PlayerRegistry is Ownable {
    mapping(address => string) public ensName;

    event ENSSet(address indexed who, string ens);

    function setENS(string calldata name) external {
        ensName[msg.sender] = name;
        emit ENSSet(msg.sender, name);
    }

    function setENSFor(address who, string calldata name) external onlyOwner {
        ensName[who] = name;
        emit ENSSet(who, name);
    }

    function getENS(address who) external view returns (string memory) {
        return ensName[who];
    }
}
