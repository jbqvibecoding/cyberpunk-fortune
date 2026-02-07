// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title GameReferral
 * @notice Referral & rewards system with on-chain tracking
 * @dev Deploy on Sepolia via Remix. Demonstrates:
 *      - Referral code registration
 *      - Multi-tier referral rewards
 *      - Points/token tracking
 *      - Leaderboard data
 */
contract GameReferral {
    address public owner;

    struct Referrer {
        address wallet;
        uint256 referralCount;
        uint256 totalRewards;  // in "points" (simulates $PIONEER)
        uint256 tier;          // 0=Bronze, 1=Silver, 2=Gold, 3=Diamond
        uint256 registeredAt;
    }

    uint256 public totalReferrers;
    uint256 public totalReferrals;

    // Referral code => Referrer data
    mapping(bytes32 => Referrer) public referrers;
    // Address => their referral code
    mapping(address => bytes32) public myReferralCode;
    // Address => who referred them
    mapping(address => bytes32) public referredBy;
    // Address => whether registered
    mapping(address => bool) public isRegistered;
    // Reward points balance
    mapping(address => uint256) public rewardPoints;

    // Tier thresholds
    uint256[4] public tierThresholds = [1, 6, 16, 50];
    uint256[4] public tierRewards = [500, 2000, 10000, 50000];
    string[4] public tierNames = ["BRONZE", "SILVER", "GOLD", "DIAMOND"];

    event ReferrerRegistered(address indexed wallet, bytes32 referralCode);
    event ReferralUsed(address indexed newUser, address indexed referrer, bytes32 referralCode);
    event RewardEarned(address indexed referrer, uint256 points, uint256 newTotal);
    event TierUpgrade(address indexed referrer, uint256 newTier, string tierName);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Register as a referrer (generates referral code from address)
     */
    function registerAsReferrer() external {
        require(myReferralCode[msg.sender] == bytes32(0), "Already registered");

        bytes32 code = keccak256(abi.encodePacked(msg.sender, block.timestamp));
        myReferralCode[msg.sender] = code;
        isRegistered[msg.sender] = true;

        referrers[code] = Referrer({
            wallet: msg.sender,
            referralCount: 0,
            totalRewards: 0,
            tier: 0,
            registeredAt: block.timestamp
        });

        totalReferrers++;
        // Give registration bonus
        rewardPoints[msg.sender] += 100;

        emit ReferrerRegistered(msg.sender, code);
        emit RewardEarned(msg.sender, 100, rewardPoints[msg.sender]);
    }

    /**
     * @notice Register with a referral code
     */
    function registerWithReferral(bytes32 _referralCode) external {
        require(!isRegistered[msg.sender], "Already registered");
        require(referrers[_referralCode].wallet != address(0), "Invalid referral code");
        require(referrers[_referralCode].wallet != msg.sender, "Cannot refer yourself");

        isRegistered[msg.sender] = true;
        referredBy[msg.sender] = _referralCode;
        totalReferrals++;

        // Update referrer
        Referrer storage ref = referrers[_referralCode];
        ref.referralCount++;

        // Calculate reward based on tier
        uint256 reward = _calculateReward(ref.referralCount);
        ref.totalRewards += reward;
        rewardPoints[ref.wallet] += reward;

        // Check tier upgrade
        uint256 newTier = _calculateTier(ref.referralCount);
        if (newTier > ref.tier) {
            ref.tier = newTier;
            // Tier upgrade bonus
            uint256 bonus = tierRewards[newTier];
            rewardPoints[ref.wallet] += bonus;
            ref.totalRewards += bonus;
            emit TierUpgrade(ref.wallet, newTier, tierNames[newTier]);
        }

        // Give new user welcome bonus
        rewardPoints[msg.sender] += 50;

        // Also generate referral code for the new user
        bytes32 newCode = keccak256(abi.encodePacked(msg.sender, block.timestamp));
        myReferralCode[msg.sender] = newCode;
        referrers[newCode] = Referrer(msg.sender, 0, 0, 0, block.timestamp);
        totalReferrers++;

        emit ReferralUsed(msg.sender, ref.wallet, _referralCode);
        emit RewardEarned(ref.wallet, reward, rewardPoints[ref.wallet]);
        emit ReferrerRegistered(msg.sender, newCode);
    }

    // ============ View Functions ============

    function getReferrerInfo(bytes32 code) external view returns (
        address wallet, uint256 referralCount, uint256 totalRewards,
        uint256 tier, string memory tierName, uint256 registeredAt
    ) {
        Referrer storage r = referrers[code];
        string memory tn = r.tier < 4 ? tierNames[r.tier] : "UNKNOWN";
        return (r.wallet, r.referralCount, r.totalRewards, r.tier, tn, r.registeredAt);
    }

    function getMyInfo(address _addr) external view returns (
        bytes32 referralCode, uint256 points, uint256 referralCount,
        uint256 tier, bool registered
    ) {
        bytes32 code = myReferralCode[_addr];
        Referrer storage r = referrers[code];
        return (code, rewardPoints[_addr], r.referralCount, r.tier, isRegistered[_addr]);
    }

    function getMyTierName(address _addr) external view returns (string memory) {
        bytes32 code = myReferralCode[_addr];
        uint256 t = referrers[code].tier;
        return t < 4 ? tierNames[t] : "UNKNOWN";
    }

    // ============ Internal ============

    function _calculateReward(uint256 count) internal pure returns (uint256) {
        if (count <= 5) return 100;
        if (count <= 15) return 200;
        if (count <= 50) return 500;
        return 1000;
    }

    function _calculateTier(uint256 count) internal view returns (uint256) {
        for (uint i = 3; i > 0; i--) {
            if (count >= tierThresholds[i]) return i;
        }
        return 0;
    }

    // ============ Admin ============

    function awardPoints(address to, uint256 points) external onlyOwner {
        rewardPoints[to] += points;
        emit RewardEarned(to, points, rewardPoints[to]);
    }
}
