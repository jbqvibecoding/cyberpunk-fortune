// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MultiplayerPokerTable
 * @notice Simplified turn-based multiplayer table that supports ETH or ERC20 buy-ins, commit-reveal actions,
 * VRF randomness recording (for shuffling), pull payouts, and house fee.
 * @dev This is an MVP; actual poker logic (hand evaluation, side pots) is intended to be resolved off-chain or
 * by an oracle/admin via `resolveRound` for now.
 * VRF is used to provide verifiable randomness for shuffling.
 */
contract MultiplayerPokerTable is VRFConsumerBaseV2, Ownable, ReentrancyGuard {
    VRFCoordinatorV2Interface public immutable vrfCoordinator;

    uint64 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 200000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 1;
    uint256 public vrfResponseTimeout = 1 hours;

    struct Table {
        address creator;
        address token; // address(0) == ETH
        uint256 buyIn;
        uint8 maxPlayers;
        address[] players;
        bool started;
        uint256 pot;
        uint256 roundId;
    }

    uint256 public tableCounter;
    mapping(uint256 => Table) public tables;

    // commit-reveal: round -> player -> commitment
    mapping(uint256 => mapping(address => bytes32)) public commitments;
    mapping(uint256 => mapping(address => bool)) public revealed;

    // pending withdrawals per token -> user
    mapping(address => mapping(address => uint256)) public pendingWithdrawals;
    
    // house balances per token
    mapping(address => uint256) public houseBalances;
    uint16 public houseFeeBps;

    // VRF bookkeeping
    mapping(uint256 => uint256) public vrfRequestToRound;
    mapping(uint256 => uint256) public roundToVrfRequest;
    mapping(uint256 => bytes32) public vrfRequestRandomnessHash;
    mapping(uint256 => uint256) public vrfRequestTimestamp;

    event TableCreated(uint256 indexed tableId, address indexed creator);
    event PlayerJoined(uint256 indexed tableId, address indexed player);
    event TableStarted(uint256 indexed tableId, uint256 indexed roundId, uint256 requestId);
    event CommitPlaced(uint256 indexed roundId, address indexed player);
    event Revealed(uint256 indexed roundId, address indexed player, string action);
    event RoundResolved(uint256 indexed roundId, address[] winners, uint256[] amounts);
    event RandomnessRevealed(uint256 indexed requestId, bytes32 randomnessHash);

    // 修复点：在构造函数中显式初始化 Ownable(msg.sender)
    constructor(
        address _vrfCoordinator, 
        uint64 _subscriptionId, 
        bytes32 _keyHash
    ) 
        VRFConsumerBaseV2(_vrfCoordinator) 
        Ownable(msg.sender) 
    {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
    }

    function createTable(address token, uint256 buyIn, uint8 maxPlayers) external returns (uint256) {
        require(maxPlayers >= 2 && maxPlayers <= 8, "invalid players");
        tableCounter++;
        uint256 id = tableCounter;
        tables[id].creator = msg.sender;
        tables[id].token = token;
        tables[id].buyIn = buyIn;
        tables[id].maxPlayers = maxPlayers;
        tables[id].started = false;
        tables[id].pot = 0;
        tables[id].roundId = 0;
        emit TableCreated(id, msg.sender);
        return id;
    }

    function joinTable(uint256 tableId) external payable nonReentrant {
        Table storage t = tables[tableId];
        require(!t.started, "already started");
        require(t.players.length < t.maxPlayers, "full");

        if (t.token == address(0)) {
            require(msg.value == t.buyIn, "incorrect buyin");
        } else {
            IERC20(t.token).transferFrom(msg.sender, address(this), t.buyIn);
        }

        // apply house fee
        uint256 fee = (t.buyIn * houseFeeBps) / 10000;
        uint256 net = t.buyIn - fee;
        houseBalances[t.token] += fee;

        t.players.push(msg.sender);
        t.pot += net;

        emit PlayerJoined(tableId, msg.sender);
    }

    function startTable(uint256 tableId) external returns (uint256) {
        Table storage t = tables[tableId];
        require(!t.started, "already started");
        require(t.players.length >= 2, "not enough players");
        t.started = true;
        t.roundId++;
        uint256 rid = t.roundId;

        // Request VRF random word for shuffling
        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        vrfRequestToRound[requestId] = rid;
        roundToVrfRequest[rid] = requestId;
        vrfRequestTimestamp[requestId] = block.timestamp;

        emit TableStarted(tableId, rid, requestId);
        return rid;
    }

    // Commit action (hash of action + salt)
    function commitAction(uint256 roundId, bytes32 commitment) external {
        require(commitments[roundId][msg.sender] == bytes32(0), "already committed");
        commitments[roundId][msg.sender] = commitment;
        emit CommitPlaced(roundId, msg.sender);
    }

    function revealAction(uint256 roundId, string calldata action, string calldata salt) external {
        bytes32 expected = keccak256(abi.encodePacked(action, salt));
        require(commitments[roundId][msg.sender] == expected, "commit mismatch");
        revealed[roundId][msg.sender] = true;
        emit Revealed(roundId, msg.sender, action);
    }

    /**
     * @notice Resolve round by admin/oracle. Distributes amounts to winners.
     */
    function resolveRound(uint256 tableId, uint256 roundId, address[] calldata winners, uint256[] calldata amounts) external onlyOwner nonReentrant {
        require(winners.length == amounts.length, "len mismatch");
        Table storage t = tables[tableId];
        require(t.roundId == roundId, "round mismatch");

        // distribute amounts into pendingWithdrawals
        for (uint i = 0; i < winners.length; i++) {
            address w = winners[i];
            uint256 a = amounts[i];
            pendingWithdrawals[t.token][w] += a;
        }

        emit RoundResolved(roundId, winners, amounts);
    }

    function withdrawPending(address token) external nonReentrant {
        uint256 amount = pendingWithdrawals[token][msg.sender];
        require(amount > 0, "Nothing to withdraw");
        pendingWithdrawals[token][msg.sender] = 0;
        if (token == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "transfer failed");
        } else {
            IERC20(token).transfer(msg.sender, amount);
        }
    }

    function setHouseFeeBps(uint16 _bps) external onlyOwner {
        houseFeeBps = _bps;
    }

    function withdrawHouse(address token, address to, uint256 amount) external onlyOwner {
        require(houseBalances[token] >= amount, "insufficient");
        houseBalances[token] -= amount;
        if (token == address(0)) {
            (bool success, ) = payable(to).call{value: amount}("");
            require(success, "transfer failed");
        } else {
            IERC20(token).transfer(to, amount);
        }
    }

    // ============ VRF Callback ============
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 roundId = vrfRequestToRound[requestId];
        bytes32 randomnessHash = keccak256(abi.encode(randomWords));
        vrfRequestRandomnessHash[roundId] = randomnessHash;
        emit RandomnessRevealed(requestId, randomnessHash);
    }

    // owner can retry VRF if timed out
    function retryVrf(uint256 roundId) external onlyOwner {
        uint256 prev = roundToVrfRequest[roundId];
        require(prev != 0, "no prev");
        require(vrfRequestRandomnessHash[roundId] == bytes32(0), "already fulfilled");
        require(block.timestamp >= vrfRequestTimestamp[prev] + vrfResponseTimeout, "not timed out");

        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        vrfRequestToRound[requestId] = roundId;
        roundToVrfRequest[roundId] = requestId;
        vrfRequestTimestamp[requestId] = block.timestamp;
    }

    receive() external payable {}
}