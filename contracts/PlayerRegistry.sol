// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PlayerRegistry
 * @notice Lightweight on-chain mapping from address -> ENS name (string).
 * No external ENS verification is enforced here.
 */
contract PlayerRegistry is Ownable {
    mapping(address => string) public ensName;
    event ENSSet(address indexed who, string ens);

    // 修复部分：显式调用 Ownable 的构造函数并传递初始所有者地址
    constructor() Ownable(msg.sender) {}

    /**
     * @notice 用户自行设置自己的 ENS 名称
     */
    function setENS(string calldata name) external {
        ensName[msg.sender] = name;
        emit ENSSet(msg.sender, name);
    }

    /**
     * @notice 仅管理员可以为指定地址设置 ENS 名称
     */
    function setENSFor(address who, string calldata name) external onlyOwner {
        ensName[who] = name;
        emit ENSSet(who, name);
    }

    /**
     * @notice 获取指定地址的 ENS 名称
     */
    function getENS(address who) external view returns (string memory) {
        return ensName[who];
        
    }
}