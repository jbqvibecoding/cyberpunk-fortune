// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/functions/v1_3_0/FunctionsClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./libraries/PokerHandEvaluator.sol";

/**
 * @title TexasHoldemAIDuel
 * @dev 修复了构造函数参数缺失和引用标记导致的解析错误
 */
contract TexasHoldemAIDuel is VRFConsumerBaseV2, FunctionsClient, Ownable, ReentrancyGuard {
    using PokerHandEvaluator for PokerHandEvaluator.Card[7];

    // ============ Enums ============
    enum GamePhase { Waiting, PreFlop, Flop, Turn, River, Showdown, Finished }
    enum PlayerAction { None, Fold, Check, Call, Raise, AllIn }

    // ============ Structs ============
    struct Game {
        address player;
        uint256 playerChips;
        uint256 aiChips;
        uint256 pot;
        uint256 currentBet;
        uint256 playerCurrentBet;
        uint256 aiCurrentBet;
        GamePhase phase;
        uint8[2] playerCards;
        uint8[2] aiCards;
        uint8[5] communityCards;
        uint8 communityCardCount;
        bool playerDealer;
        bool playerTurn;
        bool playerActed;
        bool aiActed;
        uint256 lastActionTime;
        bytes32 aiCommitment;
        PlayerAction lastAiAction;
        uint256 lastAiRaise;
    }

    // ============ State Variables ============
    VRFCoordinatorV2Interface public immutable vrfCoordinator;
    uint64 public vrfSubscriptionId;
    bytes32 public vrfKeyHash;
    uint32 public vrfCallbackGasLimit = 500000;
    uint64 public functionsSubscriptionId;
    
    uint256 public minBuyIn = 0.01 ether;
    uint256 public maxBuyIn = 1 ether;
    uint256 public smallBlind = 5;
    uint256 public bigBlind = 10;
    uint256 public aiResponseTimeout = 30 seconds;
    uint16 public houseFeeBps;
    uint256 public houseBalance;

    mapping(uint256 => Game) public games;
    mapping(address => uint256) public activeGame;
    mapping(uint256 => uint256) public vrfRequestToGame;
    mapping(address => uint256) public pendingWithdrawals;
    uint256 public gameCounter;

    // ============ Events ============
    event GameCreated(uint256 indexed gameId, address indexed player, uint256 buyIn);
    event PlayerActed(uint256 indexed gameId, PlayerAction action, uint256 amount);
    event AIActed(uint256 indexed gameId, PlayerAction action, uint256 amount, string reasoning);
    event HandCompleted(uint256 indexed gameId, bool playerWon, uint256 pot, string handDescription);

    // ============ Constructor ============
    constructor(
        address _vrfCoordinator,
        uint64 _vrfSubscriptionId,
        bytes32 _vrfKeyHash,
        address _functionsRouter,
        uint64 _functionsSubscriptionId
    ) 
        VRFConsumerBaseV2(_vrfCoordinator) 
        FunctionsClient(_functionsRouter)
        Ownable(msg.sender) 
    {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        vrfSubscriptionId = _vrfSubscriptionId;
        vrfKeyHash = _vrfKeyHash;
        functionsSubscriptionId = _functionsSubscriptionId;
    }

    // ============ External Actions ============
    function startGame() external payable nonReentrant {
        if (activeGame[msg.sender] != 0) revert("Game already active");
        if (msg.value < minBuyIn || msg.value > maxBuyIn) revert("Invalid buy-in");

        gameCounter++;
        uint256 gameId = gameCounter;
        activeGame[msg.sender] = gameId;

        uint256 fee = (msg.value * houseFeeBps) / 10000;
        houseBalance += fee;
        uint256 chips = ((msg.value - fee) * 10000) / 1 ether;

        games[gameId].player = msg.sender;
        games[gameId].playerChips = chips;
        games[gameId].aiChips = chips;
        games[gameId].playerDealer = true;

        emit GameCreated(gameId, msg.sender, msg.value);
        _requestNewHand(gameId);
    }

    function fold() external nonReentrant {
        uint256 gameId = activeGame[msg.sender];
        Game storage game = games[gameId];
        require(game.playerTurn, "Not your turn");

        game.aiChips += game.pot;
        game.pot = 0;
        emit PlayerActed(gameId, PlayerAction.Fold, 0);
        emit HandCompleted(gameId, false, 0, "Player folded");
        _startNextHand(gameId);
    }

    function check() external nonReentrant {
        uint256 gameId = activeGame[msg.sender];
        Game storage game = games[gameId];
        require(game.playerTurn && game.currentBet <= game.playerCurrentBet, "Cannot check");

        game.playerActed = true;
        emit PlayerActed(gameId, PlayerAction.Check, 0);
        _processAfterPlayerAction(gameId);
    }

    // ============ Internal Logic ============
    function _requestNewHand(uint256 gameId) internal {
        uint256 requestId = vrfCoordinator.requestRandomWords(
            vrfKeyHash, vrfSubscriptionId, 3, vrfCallbackGasLimit, 9
        );
        vrfRequestToGame[requestId] = gameId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 gameId = vrfRequestToGame[requestId];
        Game storage game = games[gameId];

        uint8[52] memory deck = _createDeck();
        deck = _shuffleDeck(deck, randomWords[0]);

        game.playerCards = [deck[0], deck[1]];
        game.aiCards = [deck[2], deck[3]];
        for (uint i = 0; i < 5; i++) game.communityCards[i] = deck[4+i];

        _postBlinds(gameId);
        game.phase = GamePhase.PreFlop;
        game.playerTurn = game.playerDealer;
        if (!game.playerTurn) _requestAIDecision(gameId);
    }

    function _createDeck() internal pure returns (uint8[52] memory deck) {
        for (uint8 i = 0; i < 52; i++) deck[i] = i;
        return deck;
    }

    function _shuffleDeck(uint8[52] memory deck, uint256 seed) internal pure returns (uint8[52] memory) {
        for (uint256 i = 51; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encodePacked(seed, i))) % (i + 1);
            (deck[i], deck[j]) = (deck[j], deck[i]);
        }
        return deck;
    }

    function _postBlinds(uint256 gameId) internal {
        Game storage game = games[gameId];
        uint256 sb = smallBlind;
        uint256 bb = bigBlind;
        if (game.playerDealer) {
            game.playerChips -= sb; game.playerCurrentBet = sb;
            game.aiChips -= bb; game.aiCurrentBet = bb;
            game.currentBet = bb;
        } else {
            game.aiChips -= sb; game.aiCurrentBet = sb;
            game.playerChips -= bb; game.playerCurrentBet = bb;
            game.currentBet = bb;
        }
        game.pot = sb + bb;
    }

    function _requestAIDecision(uint256 gameId) internal {
        games[gameId].playerTurn = false;
        _simulateAIDecision(gameId);
    }

    function _simulateAIDecision(uint256 gameId) internal {
        Game storage game = games[gameId];
        // 简化的 AI：如果有注就跟注，没注就过牌
        uint256 callAmount = game.currentBet - game.aiCurrentBet;
        if (callAmount > 0) {
            game.aiChips -= callAmount;
            game.aiCurrentBet += callAmount;
            game.pot += callAmount;
            emit AIActed(gameId, PlayerAction.Call, callAmount, "AI calls");
        } else {
            emit AIActed(gameId, PlayerAction.Check, 0, "AI checks");
        }
        game.aiActed = true;
        _processAfterAIAction(gameId);
    }

    function _processAfterPlayerAction(uint256 gameId) internal {
        Game storage game = games[gameId];
        if (game.playerActed && game.aiActed && game.playerCurrentBet == game.aiCurrentBet) {
            // 推进阶段逻辑（省略细节）
        } else {
            _requestAIDecision(gameId);
        }
    }

    function _processAfterAIAction(uint256 gameId) internal {
        games[gameId].playerTurn = true;
    }

    function _startNextHand(uint256 gameId) internal {
        if (games[gameId].playerChips == 0 || games[gameId].aiChips == 0) {
            games[gameId].phase = GamePhase.Finished;
            delete activeGame[games[gameId].player];
        } else {
            games[gameId].playerDealer = !games[gameId].playerDealer;
            _requestNewHand(gameId);
        }
    }

    function _fulfillRequest(bytes32 rId, bytes memory resp, bytes memory err) internal override {}
}