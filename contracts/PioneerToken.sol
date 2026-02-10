// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PioneerToken is ERC20, Ownable {
    /**
     * @dev 构造函数
     * @param name 代币名称
     * @param symbol 代币符号
     * @param initialOwner 指定合约的初始所有者（管理员地址）
     */
    constructor(
        string memory name, 
        string memory symbol, 
        address initialOwner
    ) 
        ERC20(name, symbol) 
        Ownable(initialOwner) 
    {}

    /**
     * @dev 铸造代币，只有所有者可以调用
     * @param to 接收代币的地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}