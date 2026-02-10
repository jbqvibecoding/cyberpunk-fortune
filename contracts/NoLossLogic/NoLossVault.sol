// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// 示例：使用 Compound cETH (真实项目换成 Aave ILendingPool)
interface ICETH {
    function mint() external payable;
    function redeemUnderlying(uint redeemAmount) external returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function exchangeRateStored() external view returns (uint);
}

contract NoLossVault is Ownable, ReentrancyGuard {
    ICETH public cETH;                    // Compound cETH 接口（示例）
    IERC20 public prizeToken;             // 奖励代币（如 PioneerToken）
    
    struct NoLossTicket {
        address player;
        uint256 principal;                // 本金 (wei)
        uint256 depositShares;            // cETH 份额
        uint256 depositTime;
        bool redeemed;
    }
    
    mapping(uint256 => NoLossTicket) public tickets;
    uint256 public noLossPrizePool;       // 利息形成的奖池
    
    event Deposited(uint256 ticketId, address player, uint256 amount);
    event Redeemed(uint256 ticketId, address player, uint256 principal, uint256 interest);
    event InterestHarvested(uint256 interest);

    constructor(address _cETH, address _prizeToken) {
        cETH = ICETH(_cETH);
        prizeToken = IERC20(_prizeToken);
    }

    // NoLoss 存款（从 CyberPowerball 调用）
    function deposit(uint256 ticketId, address player) external payable nonReentrant {
        require(msg.value > 0, "Zero deposit");
        
        // 存入 Compound
        uint256 sharesBefore = cETH.balanceOf(address(this));
        cETH.mint{value: msg.value}();
        uint256 shares = cETH.balanceOf(address(this)) - sharesBefore;
        
        tickets[ticketId] = NoLossTicket({
            player: player,
            principal: msg.value,
            depositShares: shares,
            depositTime: block.timestamp,
            redeemed: false
        });
        
        emit Deposited(ticketId, player, msg.value);
    }

    // 提取利息到奖池（Automation 调用）
    function harvestInterest() external {
        uint256 totalShares = cETH.balanceOf(address(this));
        uint256 totalValue = (totalShares * cETH.exchangeRateStored()) / 1e18;
        uint256 totalPrincipal = 0; // 实际项目需累加所有未赎回 principal
        
        uint256 interest = totalValue - totalPrincipal;
        if (interest > 0) {
            // 提取利息
            uint256 toWithdraw = interest; // 简化，实际按比例
            cETH.redeemUnderlying(toWithdraw);
            noLossPrizePool += toWithdraw;
            emit InterestHarvested(toWithdraw);
        }
    }

    // 用户赎回本金
    function redeem(uint256 ticketId) external nonReentrant {
        NoLossTicket storage t = tickets[ticketId];
        require(!t.redeemed, "Already redeemed");
        require(msg.sender == t.player, "Not owner");
        
        uint256 shares = t.depositShares;
        uint256 value = (shares * cETH.exchangeRateStored()) / 1e18;
        uint256 interest = value - t.principal;
        
        cETH.redeemUnderlying(value);
        payable(t.player).transfer(t.principal + interest); // 或用 prizeToken
        
        t.redeemed = true;
        emit Redeemed(ticketId, t.player, t.principal, interest);
    }
}