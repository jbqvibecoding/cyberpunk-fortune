// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Referral
 * @notice Simple referral recorder that pays out ERC20 rewards to referrers
 */
contract Referral is Ownable {
    IERC20 public rewardToken;
    uint256 public rewardAmount;

    mapping(address => bool) public referred; // referred[user] == true means user already used a referrer
    mapping(address => uint256) public referralsCount; // how many referrals a referrer has

    event ReferralRegistered(address indexed referrer, address indexed referredUser, uint256 reward);

    constructor(address _rewardToken, uint256 _rewardAmount) {
        rewardToken = IERC20(_rewardToken);
        rewardAmount = _rewardAmount;
    }

    function setRewardToken(address _token) external onlyOwner {
        rewardToken = IERC20(_token);
    }

    function setRewardAmount(uint256 _amount) external onlyOwner {
        rewardAmount = _amount;
    }

    /**
     * @notice Called by the new user to register who referred them
     * @param referrer address of the referrer
     */
    function registerReferral(address referrer) external {
        require(referrer != address(0), "Invalid referrer");
        require(referrer != msg.sender, "Cannot self refer");
        require(!referred[msg.sender], "Already referred");

        referred[msg.sender] = true;
        referralsCount[referrer]++;

        // transfer reward to referrer if contract funded
        if (rewardAmount > 0) {
            // safe transfer assumption: token follows ERC20 standard
            if (rewardToken.balanceOf(address(this)) >= rewardAmount) {
                rewardToken.transfer(referrer, rewardAmount);
            }
        }

        emit ReferralRegistered(referrer, msg.sender, rewardAmount);
    }

    function withdrawTokens(address to, uint256 amount) external onlyOwner {
        rewardToken.transfer(to, amount);
    }
}
