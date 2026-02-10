// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract StakingPool is Ownable, ReentrancyGuard {
    IERC20 public pioneerToken;           // $PIONEER ERC20
    uint256 public totalStaked;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;

    mapping(address => uint256) public userStaked;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public userRewards;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(address _pioneerToken) {
        pioneerToken = IERC20(_pioneerToken);
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            userRewards[account] += earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    // 计算当前 reward per token
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        return rewardPerTokenStored + ((block.timestamp - lastUpdateTime) * 100) / totalStaked; // 示例：每秒 100 奖励
    }

    // 用户已赚取的奖励
    function earned(address account) public view returns (uint256) {
        return (userStaked[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18 + userRewards[account];
    }

    // 质押
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        pioneerToken.transferFrom(msg.sender, address(this), amount);
        userStaked[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    // 解除质押
    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0 && amount <= userStaked[msg.sender], "Invalid amount");
        userStaked[msg.sender] -= amount;
        totalStaked -= amount;
        pioneerToken.transfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    // 领取奖励
    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = userRewards[msg.sender];
        if (reward > 0) {
            userRewards[msg.sender] = 0;
            pioneerToken.transfer(msg.sender, reward); // 或用 ETH
            emit RewardPaid(msg.sender, reward);
        }
    }

    // owner 添加奖励（例如从 houseBalance 转入）
    function notifyReward(uint256 amount) external onlyOwner {
        pioneerToken.transferFrom(msg.sender, address(this), amount);
        // 实际应更新 rewardRate，这里简化
    }
}