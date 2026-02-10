// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NoLossDraw is VRFConsumerBaseV2, AutomationCompatibleInterface, Ownable, ReentrancyGuard {
    VRFCoordinatorV2Interface public immutable vrfCoordinator;
    uint64 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 300000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;

    uint256 public lastDrawTime;
    uint256 public drawInterval = 7 days; // 每周抽一次
    uint256 public noLossPrizePool;       // 来自 NoLossVault 的利息奖池

    address public noLossVault;           // NoLossVault 合约地址

    mapping(uint256 => address) public winners;
    mapping(uint256 => uint256) public drawIdToRequestId;

    event DrawRequested(uint256 drawId, uint256 requestId);
    event WinnerSelected(uint256 drawId, address winner, uint256 amount);

    constructor(
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        address _noLossVault
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        noLossVault = _noLossVault;
        lastDrawTime = block.timestamp;
    }

    // Chainlink Automation 检查是否需要开奖
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory) {
        upkeepNeeded = (block.timestamp >= lastDrawTime + drawInterval) && (noLossPrizePool > 0);
        return (upkeepNeeded, "");
    }

    // 执行开奖
    function performUpkeep(bytes calldata) external override {
        require(block.timestamp >= lastDrawTime + drawInterval, "Too early");
        require(noLossPrizePool > 0, "No prize pool");

        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        drawIdToRequestId[block.timestamp] = requestId; // 用时间戳作为 drawId
        emit DrawRequested(block.timestamp, requestId);
    }

    // VRF 回调：选出 winner 并发放奖金
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 drawId = 0;
        // 查找对应的 drawId（实际项目中可以用更可靠的 mapping）
        for (uint256 i = lastDrawTime; i <= block.timestamp; i++) {
            if (drawIdToRequestId[i] == requestId) {
                drawId = i;
                break;
            }
        }
        require(drawId != 0, "Invalid request");

        // 简单随机：假设从 vault 获取参与者列表（实际需从 NoLossVault 取）
        // 这里简化：随机金额发放给 owner（实际应从参与者中选）
        uint256 prize = noLossPrizePool / 2; // 50% 发奖，剩余滚存
        noLossPrizePool -= prize;

        // 实际应调用 NoLossVault 发放，或直接转给 winner
        payable(owner()).transfer(prize); // 示例：发给 owner，实际改成 winner

        lastDrawTime = block.timestamp;
        winners[drawId] = owner(); // 示例
        emit WinnerSelected(drawId, owner(), prize);
    }

    // 从 NoLossVault 接收利息
    function receiveInterest() external payable {
        require(msg.sender == noLossVault, "Only vault");
        noLossPrizePool += msg.value;
    }

    // owner 手动设置
    function setDrawInterval(uint256 _interval) external onlyOwner {
        drawInterval = _interval;
    }
}