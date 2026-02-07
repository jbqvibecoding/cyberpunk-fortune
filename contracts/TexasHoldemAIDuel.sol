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
 * @notice 1v1 Texas Hold'em against an AI opponent powered by LLM
 * @dev Uses Chainlink VRF for card dealing, Chainlink Functions for AI decisions
 */
contract TexasHoldemAIDuel is VRFConsumerBaseV2, FunctionsClient, Ownable, ReentrancyGuard {
    using PokerHandEvaluator for PokerHandEvaluator.Card[7];

    // ============ Enums ============
    
    enum GamePhase { 
        Waiting,      // No active game
        PreFlop,      // Hole cards dealt
        Flop,         // 3 community cards
        Turn,         // 4th community card
        River,        // 5th community card
        Showdown,     // Reveal hands
        Finished      // Game ended
    }

    enum PlayerAction {
        None,
        Fold,
        Check,
        Call,
        Raise,
        AllIn
    }

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
        uint8[2] playerCards;      // Encoded as rank * 4 + suit
        uint8[2] aiCards;
        uint8[5] communityCards;
        uint8 communityCardCount;
        bool playerDealer;         // Dealer rotates each hand
        bool playerTurn;
        bool playerActed;
        bool aiActed;
        uint256 lastActionTime;
        bytes32 aiCommitment;      // For commit-reveal
        PlayerAction lastAiAction;
        uint256 lastAiRaise;
    }

    struct GameHistory {
        uint256 gameId;
        address player;
        uint256 buyIn;
        uint256 finalChips;
        bool playerWon;
        uint256 handsPlayed;
        uint256 timestamp;
    }

    // ============ State Variables ============
    
    // Chainlink VRF
    VRFCoordinatorV2Interface public immutable vrfCoordinator;
    uint64 public vrfSubscriptionId;
    bytes32 public vrfKeyHash;
    uint32 public vrfCallbackGasLimit = 500000;
    uint16 public vrfRequestConfirmations = 3;
    // VRF response timeout for retries
    uint256 public vrfResponseTimeout = 1 hours;
    // mappings to store randomness hash and timestamps
    mapping(uint256 => bytes32) public vrfRequestRandomnessHash;
    mapping(uint256 => uint256) public vrfRequestTimestamp;
    // game -> latest vrf request
    mapping(uint256 => uint256) public gameToVrfRequest;

    // Chainlink Functions
    bytes32 public functionsSourceHash;
    uint64 public functionsSubscriptionId;
    uint32 public functionsGasLimit = 300000;

    // Game configuration
    uint256 public minBuyIn = 0.01 ether;
    uint256 public maxBuyIn = 1 ether;
    uint256 public smallBlind = 5;  // Chips, not ETH
    uint256 public bigBlind = 10;
    uint256 public aiResponseTimeout = 30 seconds;
    // House fee (basis points) and house balance
    uint16 public houseFeeBps;
    uint256 public houseBalance;
    // Pending withdrawals for players (pull pattern)
    mapping(address => uint256) public pendingWithdrawals;

    // Game state
    uint256 public gameCounter;
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public activeGame;
    mapping(uint256 => uint256) public vrfRequestToGame;
    mapping(bytes32 => uint256) public functionsRequestToGame;
    
    // History
    GameHistory[] public gameHistory;

    // Deck state (for shuffling)
    uint256 private deckSeed;
    uint8 private cardsDealt;

    // ============ Events ============
    
    event GameCreated(uint256 indexed gameId, address indexed player, uint256 buyIn);
    event CardsDealt(uint256 indexed gameId, GamePhase phase);
    event PlayerActed(uint256 indexed gameId, PlayerAction action, uint256 amount);
    event AIActed(uint256 indexed gameId, PlayerAction action, uint256 amount, string reasoning);
    event PhaseAdvanced(uint256 indexed gameId, GamePhase newPhase);
    event HandCompleted(uint256 indexed gameId, bool playerWon, uint256 pot, string handDescription);
    event GameEnded(uint256 indexed gameId, bool playerWon, uint256 finalChips);
    event AICommitment(uint256 indexed gameId, bytes32 commitment);
    event RandomnessRevealed(uint256 indexed requestId, bytes32 randomnessHash);
    event RandomWordsFulfilled(uint256 indexed requestId, uint256[] randomWords);
    event WithdrawalPending(address indexed user, uint256 amount);
    event WithdrawalExecuted(address indexed user, uint256 amount);

    // ============ Errors ============
    
    error GameAlreadyActive();
    error NoActiveGame();
    error InvalidBuyIn();
    error NotYourTurn();
    error InvalidAction();
    error InsufficientChips();
    error GameNotFinished();
    error AITimeout();

    // ============ Constructor ============
    
    constructor(
        address _vrfCoordinator,
        uint64 _vrfSubscriptionId,
        bytes32 _vrfKeyHash,
        address _functionsRouter,
        uint64 _functionsSubscriptionId
    ) VRFConsumerBaseV2(_vrfCoordinator) FunctionsClient(_functionsRouter) {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        vrfSubscriptionId = _vrfSubscriptionId;
        vrfKeyHash = _vrfKeyHash;
        functionsSubscriptionId = _functionsSubscriptionId;
    }

    // ============ External Functions ============

    /**
     * @notice Start a new game against the AI
     */
    function startGame() external payable nonReentrant {
        if (activeGame[msg.sender] != 0) revert GameAlreadyActive();
        if (msg.value < minBuyIn || msg.value > maxBuyIn) revert InvalidBuyIn();

        gameCounter++;
        uint256 gameId = gameCounter;
        activeGame[msg.sender] = gameId;

        // Apply house fee and convert ETH to chips (1 ETH = 10000 chips)
        uint256 fee = (uint256(msg.value) * uint256(houseFeeBps)) / 10000;
        uint256 net = msg.value - fee;
        houseBalance += fee;
        uint256 chips = (net * 10000) / 1 ether;

        games[gameId] = Game({
            player: msg.sender,
            playerChips: chips,
            aiChips: chips,  // AI matches player's buy-in
            pot: 0,
            currentBet: 0,
            playerCurrentBet: 0,
            aiCurrentBet: 0,
            phase: GamePhase.Waiting,
            playerCards: [uint8(0), 0],
            aiCards: [uint8(0), 0],
            communityCards: [uint8(0), 0, 0, 0, 0],
            communityCardCount: 0,
            playerDealer: true,  // Player starts as dealer
            playerTurn: false,
            playerActed: false,
            aiActed: false,
            lastActionTime: block.timestamp,
            aiCommitment: bytes32(0),
            lastAiAction: PlayerAction.None,
            lastAiRaise: 0
        });

        emit GameCreated(gameId, msg.sender, msg.value);

        // Request random cards for the first hand
        _requestNewHand(gameId);
    }

    /**
     * @notice Player action: Fold
     */
    function fold() external nonReentrant {
        uint256 gameId = activeGame[msg.sender];
        if (gameId == 0) revert NoActiveGame();
        
        Game storage game = games[gameId];
        if (!game.playerTurn) revert NotYourTurn();

        game.playerActed = true;
        emit PlayerActed(gameId, PlayerAction.Fold, 0);

        // AI wins the pot
        game.aiChips += game.pot;
        game.pot = 0;

        emit HandCompleted(gameId, false, game.pot, "Player folded");

        _startNextHand(gameId);
    }

    /**
     * @notice Player action: Check (if no bet to match)
     */
    function check() external nonReentrant {
        uint256 gameId = activeGame[msg.sender];
        if (gameId == 0) revert NoActiveGame();
        
        Game storage game = games[gameId];
        if (!game.playerTurn) revert NotYourTurn();
        if (game.currentBet > game.playerCurrentBet) revert InvalidAction();

        game.playerActed = true;
        emit PlayerActed(gameId, PlayerAction.Check, 0);

        _processAfterPlayerAction(gameId);
    }

    /**
     * @notice Player action: Call (match current bet)
     */
    function call() external nonReentrant {
        uint256 gameId = activeGame[msg.sender];
        if (gameId == 0) revert NoActiveGame();
        
        Game storage game = games[gameId];
        if (!game.playerTurn) revert NotYourTurn();

        uint256 callAmount = game.currentBet - game.playerCurrentBet;
        if (callAmount > game.playerChips) {
            callAmount = game.playerChips; // All-in
        }

        game.playerChips -= callAmount;
        game.playerCurrentBet += callAmount;
        game.pot += callAmount;
        game.playerActed = true;

        emit PlayerActed(gameId, PlayerAction.Call, callAmount);

        _processAfterPlayerAction(gameId);
    }

    /**
     * @notice Player action: Raise
     * @param amount Total raise amount (including call)
     */
    function raise(uint256 amount) external nonReentrant {
        uint256 gameId = activeGame[msg.sender];
        if (gameId == 0) revert NoActiveGame();
        
        Game storage game = games[gameId];
        if (!game.playerTurn) revert NotYourTurn();
        if (amount <= game.currentBet) revert InvalidAction();
        if (amount > game.playerChips + game.playerCurrentBet) revert InsufficientChips();

        uint256 toAdd = amount - game.playerCurrentBet;
        game.playerChips -= toAdd;
        game.playerCurrentBet = amount;
        game.pot += toAdd;
        game.currentBet = amount;
        game.playerActed = true;
        game.aiActed = false; // AI must respond to raise

        emit PlayerActed(gameId, PlayerAction.Raise, amount);

        _requestAIDecision(gameId);
    }

    /**
     * @notice Player action: All-In
     */
    function allIn() external nonReentrant {
        uint256 gameId = activeGame[msg.sender];
        if (gameId == 0) revert NoActiveGame();
        
        Game storage game = games[gameId];
        if (!game.playerTurn) revert NotYourTurn();

        uint256 allInAmount = game.playerChips;
        game.pot += allInAmount;
        game.playerCurrentBet += allInAmount;
        game.playerChips = 0;
        game.playerActed = true;

        if (game.playerCurrentBet > game.currentBet) {
            game.currentBet = game.playerCurrentBet;
            game.aiActed = false;
        }

        emit PlayerActed(gameId, PlayerAction.AllIn, allInAmount);

        _processAfterPlayerAction(gameId);
    }

    /**
     * @notice Claim AI timeout (if AI takes too long)
     */
    function claimAITimeout() external nonReentrant {
        uint256 gameId = activeGame[msg.sender];
        if (gameId == 0) revert NoActiveGame();
        
        Game storage game = games[gameId];
        if (game.playerTurn) revert InvalidAction();
        if (block.timestamp < game.lastActionTime + aiResponseTimeout) revert InvalidAction();

        // Player wins the pot due to AI timeout (chips updated)
        game.playerChips += game.pot;
        game.pot = 0;

        emit HandCompleted(gameId, true, game.pot, "AI timeout");

        _startNextHand(gameId);
    }

    /**
     * @notice Cash out and end the game
     */
    function cashOut() external nonReentrant {
        uint256 gameId = activeGame[msg.sender];
        if (gameId == 0) revert NoActiveGame();
        
        Game storage game = games[gameId];
        if (game.phase != GamePhase.Waiting && game.phase != GamePhase.Finished) {
            revert GameNotFinished();
        }

        uint256 payout = (game.playerChips * 1 ether) / 10000;
        bool playerWon = game.playerChips > game.aiChips;

        // Record history
        gameHistory.push(GameHistory({
            gameId: gameId,
            player: msg.sender,
            buyIn: (game.playerChips + game.aiChips) / 2 * 1 ether / 10000,
            finalChips: game.playerChips,
            playerWon: playerWon,
            handsPlayed: 0, // Could track this
            timestamp: block.timestamp
        }));

        delete activeGame[msg.sender];

        emit GameEnded(gameId, playerWon, game.playerChips);

        if (payout > 0) {
            pendingWithdrawals[msg.sender] += payout;
            emit WithdrawalPending(msg.sender, payout);
        }
    }

    // ============ Chainlink VRF ============

    /**
     * @notice Request random numbers for card dealing
     */
    function _requestNewHand(uint256 gameId) internal {
        uint256 requestId = vrfCoordinator.requestRandomWords(
            vrfKeyHash,
            vrfSubscriptionId,
            vrfRequestConfirmations,
            vrfCallbackGasLimit,
            9  // 2 player + 2 AI + 5 community = 9 cards
        );
        vrfRequestToGame[requestId] = gameId;
        gameToVrfRequest[gameId] = requestId;
        vrfRequestTimestamp[requestId] = block.timestamp;
    }

    /**
     * @notice Chainlink VRF callback
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 gameId = vrfRequestToGame[requestId];
        Game storage game = games[gameId];

        // Store and emit randomness hash for transparency
        bytes32 randomnessHash = keccak256(abi.encode(randomWords));
        vrfRequestRandomnessHash[requestId] = randomnessHash;
        emit RandomnessRevealed(requestId, randomnessHash);
        emit RandomWordsFulfilled(requestId, randomWords);

        // Shuffle and deal cards
        uint8[52] memory deck = _createDeck();
        deckSeed = randomWords[0];
        deck = _shuffleDeck(deck, deckSeed);

        // Deal hole cards
        game.playerCards = [deck[0], deck[1]];
        game.aiCards = [deck[2], deck[3]];
        
        // Pre-deal community cards (revealed later)
        for (uint i = 0; i < 5; i++) {
            game.communityCards[i] = deck[4 + i];
        }
        game.communityCardCount = 0;

        // Post blinds
        _postBlinds(gameId);

        game.phase = GamePhase.PreFlop;
        game.lastActionTime = block.timestamp;

        emit CardsDealt(gameId, GamePhase.PreFlop);

        // In heads-up, dealer (SB) acts first pre-flop
        if (game.playerDealer) {
            game.playerTurn = true;
        } else {
            _requestAIDecision(gameId);
        }
    }

    // ============ Chainlink Functions (AI) ============

    /**
     * @notice Request AI decision via Chainlink Functions
     */
    function _requestAIDecision(uint256 gameId) internal {
        Game storage game = games[gameId];
        game.playerTurn = false;
        game.lastActionTime = block.timestamp;

        // Build the request for the AI
        string memory source = _buildAIPrompt(gameId);
        
        // In production, this would call the OpenAI API via Chainlink Functions
        // For testnet, we simulate with a basic strategy
        _simulateAIDecision(gameId);
    }

    /**
     * @notice Build AI prompt based on game state
     */
    function _buildAIPrompt(uint256 gameId) internal view returns (string memory) {
        Game storage game = games[gameId];
        
        // This would be the actual prompt sent to OpenAI
        return string(abi.encodePacked(
            "You are playing Texas Hold'em. ",
            "Your cards: ", _cardToString(game.aiCards[0]), ", ", _cardToString(game.aiCards[1]), ". ",
            "Pot: ", _uint2str(game.pot), ". ",
            "Current bet: ", _uint2str(game.currentBet), ". ",
            "Your chips: ", _uint2str(game.aiChips), ". ",
            "Decide: fold, check, call, raise, or all-in."
        ));
    }

    /**
     * @notice Simulate AI decision (for testnet without Chainlink Functions)
     */
    function _simulateAIDecision(uint256 gameId) internal {
        Game storage game = games[gameId];

        // Simple AI strategy based on hand strength
        uint256 handStrength = _evaluateAIHandStrength(gameId);
        uint256 callAmount = game.currentBet - game.aiCurrentBet;

        PlayerAction action;
        uint256 raiseAmount = 0;
        string memory reasoning;

        if (handStrength > 80) {
            // Strong hand - raise
            action = PlayerAction.Raise;
            raiseAmount = game.currentBet + game.pot / 2;
            if (raiseAmount > game.aiChips) {
                action = PlayerAction.AllIn;
            }
            reasoning = "Strong hand, raising for value";
        } else if (handStrength > 50) {
            // Medium hand
            if (callAmount == 0) {
                // Can check
                if (handStrength > 65) {
                    action = PlayerAction.Raise;
                    raiseAmount = game.pot / 2;
                    reasoning = "Decent hand, betting for value";
                } else {
                    action = PlayerAction.Check;
                    reasoning = "Medium hand, checking";
                }
            } else if (callAmount <= game.aiChips / 4) {
                action = PlayerAction.Call;
                reasoning = "Reasonable pot odds, calling";
            } else {
                action = PlayerAction.Fold;
                reasoning = "Too expensive to call";
            }
        } else {
            // Weak hand
            if (callAmount == 0) {
                action = PlayerAction.Check;
                reasoning = "Weak hand, free card";
            } else {
                action = PlayerAction.Fold;
                reasoning = "Weak hand, folding";
            }
        }

        _executeAIAction(gameId, action, raiseAmount, reasoning);
    }

    /**
     * @notice Execute AI action
     */
    function _executeAIAction(
        uint256 gameId,
        PlayerAction action,
        uint256 amount,
        string memory reasoning
    ) internal {
        Game storage game = games[gameId];

        if (action == PlayerAction.Fold) {
            game.playerChips += game.pot;
            game.pot = 0;
            emit AIActed(gameId, action, 0, reasoning);
            emit HandCompleted(gameId, true, game.pot, "AI folded");
            _startNextHand(gameId);
            return;
        }

        if (action == PlayerAction.Check) {
            game.aiActed = true;
            emit AIActed(gameId, action, 0, reasoning);
        } else if (action == PlayerAction.Call) {
            uint256 callAmount = game.currentBet - game.aiCurrentBet;
            if (callAmount > game.aiChips) callAmount = game.aiChips;
            game.aiChips -= callAmount;
            game.aiCurrentBet += callAmount;
            game.pot += callAmount;
            game.aiActed = true;
            emit AIActed(gameId, action, callAmount, reasoning);
        } else if (action == PlayerAction.Raise) {
            uint256 toAdd = amount - game.aiCurrentBet;
            if (toAdd > game.aiChips) toAdd = game.aiChips;
            game.aiChips -= toAdd;
            game.aiCurrentBet += toAdd;
            game.pot += toAdd;
            game.currentBet = game.aiCurrentBet;
            game.aiActed = true;
            game.playerActed = false;
            emit AIActed(gameId, action, amount, reasoning);
        } else if (action == PlayerAction.AllIn) {
            uint256 allInAmount = game.aiChips;
            game.pot += allInAmount;
            game.aiCurrentBet += allInAmount;
            game.aiChips = 0;
            if (game.aiCurrentBet > game.currentBet) {
                game.currentBet = game.aiCurrentBet;
                game.playerActed = false;
            }
            game.aiActed = true;
            emit AIActed(gameId, action, allInAmount, reasoning);
        }

        game.lastAiAction = action;
        game.lastAiRaise = amount;

        _processAfterAIAction(gameId);
    }

    // ============ Internal Game Logic ============

    function _postBlinds(uint256 gameId) internal {
        Game storage game = games[gameId];

        if (game.playerDealer) {
            // Player is dealer = SB, AI is BB
            uint256 playerSB = smallBlind > game.playerChips ? game.playerChips : smallBlind;
            uint256 aiBB = bigBlind > game.aiChips ? game.aiChips : bigBlind;
            
            game.playerChips -= playerSB;
            game.playerCurrentBet = playerSB;
            game.aiChips -= aiBB;
            game.aiCurrentBet = aiBB;
            game.pot = playerSB + aiBB;
            game.currentBet = aiBB;
        } else {
            // AI is dealer = SB, Player is BB
            uint256 aiSB = smallBlind > game.aiChips ? game.aiChips : smallBlind;
            uint256 playerBB = bigBlind > game.playerChips ? game.playerChips : bigBlind;
            
            game.aiChips -= aiSB;
            game.aiCurrentBet = aiSB;
            game.playerChips -= playerBB;
            game.playerCurrentBet = playerBB;
            game.pot = aiSB + playerBB;
            game.currentBet = playerBB;
        }
    }

    function _processAfterPlayerAction(uint256 gameId) internal {
        Game storage game = games[gameId];

        // Check if betting round is complete
        if (game.playerActed && game.aiActed && 
            game.playerCurrentBet == game.aiCurrentBet) {
            _advancePhase(gameId);
        } else if (!game.aiActed || game.playerCurrentBet > game.aiCurrentBet) {
            _requestAIDecision(gameId);
        } else {
            game.playerTurn = true;
        }
    }

    function _processAfterAIAction(uint256 gameId) internal {
        Game storage game = games[gameId];

        // Check if betting round is complete
        if (game.playerActed && game.aiActed && 
            game.playerCurrentBet == game.aiCurrentBet) {
            _advancePhase(gameId);
        } else {
            game.playerTurn = true;
        }
    }

    function _advancePhase(uint256 gameId) internal {
        Game storage game = games[gameId];

        // Reset betting state
        game.playerCurrentBet = 0;
        game.aiCurrentBet = 0;
        game.currentBet = 0;
        game.playerActed = false;
        game.aiActed = false;

        if (game.phase == GamePhase.PreFlop) {
            game.phase = GamePhase.Flop;
            game.communityCardCount = 3;
        } else if (game.phase == GamePhase.Flop) {
            game.phase = GamePhase.Turn;
            game.communityCardCount = 4;
        } else if (game.phase == GamePhase.Turn) {
            game.phase = GamePhase.River;
            game.communityCardCount = 5;
        } else if (game.phase == GamePhase.River) {
            _showdown(gameId);
            return;
        }

        emit PhaseAdvanced(gameId, game.phase);
        emit CardsDealt(gameId, game.phase);

        // Post-flop: non-dealer acts first
        if (game.playerDealer) {
            _requestAIDecision(gameId);
        } else {
            game.playerTurn = true;
        }
    }

    function _showdown(uint256 gameId) internal {
        Game storage game = games[gameId];
        game.phase = GamePhase.Showdown;

        // Evaluate hands
        PokerHandEvaluator.Card[7] memory playerHand;
        PokerHandEvaluator.Card[7] memory aiHand;

        // Player hand
        playerHand[0] = _decodeCard(game.playerCards[0]);
        playerHand[1] = _decodeCard(game.playerCards[1]);
        
        // AI hand
        aiHand[0] = _decodeCard(game.aiCards[0]);
        aiHand[1] = _decodeCard(game.aiCards[1]);

        // Community cards
        for (uint i = 0; i < 5; i++) {
            PokerHandEvaluator.Card memory card = _decodeCard(game.communityCards[i]);
            playerHand[2 + i] = card;
            aiHand[2 + i] = card;
        }

        PokerHandEvaluator.HandResult memory playerResult = playerHand.evaluateHand();
        PokerHandEvaluator.HandResult memory aiResult = aiHand.evaluateHand();

        int8 comparison = PokerHandEvaluator.compareHands(playerResult, aiResult);

        bool playerWon;
        string memory handDesc;

        if (comparison > 0) {
            game.playerChips += game.pot;
            playerWon = true;
            handDesc = "Player wins";
        } else if (comparison < 0) {
            game.aiChips += game.pot;
            playerWon = false;
            handDesc = "AI wins";
        } else {
            // Tie - split pot
            game.playerChips += game.pot / 2;
            game.aiChips += game.pot / 2;
            playerWon = false;
            handDesc = "Split pot";
        }

        game.pot = 0;

        emit HandCompleted(gameId, playerWon, game.pot, handDesc);

        _startNextHand(gameId);
    }

    function _startNextHand(uint256 gameId) internal {
        Game storage game = games[gameId];

        // Check if game should end
        if (game.playerChips == 0 || game.aiChips == 0) {
            game.phase = GamePhase.Finished;
            emit GameEnded(gameId, game.playerChips > 0, game.playerChips);
            return;
        }

        // Rotate dealer
        game.playerDealer = !game.playerDealer;
        
        // Reset hand state
        game.phase = GamePhase.Waiting;
        game.pot = 0;
        game.currentBet = 0;
        game.playerCurrentBet = 0;
        game.aiCurrentBet = 0;
        game.playerActed = false;
        game.aiActed = false;

        // Request new cards
        _requestNewHand(gameId);
    }

    // ============ Helper Functions ============

    function _createDeck() internal pure returns (uint8[52] memory deck) {
        for (uint8 i = 0; i < 52; i++) {
            deck[i] = i;
        }
        return deck;
    }

    function _shuffleDeck(uint8[52] memory deck, uint256 seed) internal pure returns (uint8[52] memory) {
        for (uint256 i = 51; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encodePacked(seed, i))) % (i + 1);
            (deck[i], deck[j]) = (deck[j], deck[i]);
        }
        return deck;
    }

    /**
     * @notice Withdraw available pending prizes
     */
    function withdrawPending() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert("Nothing to withdraw");

        pendingWithdrawals[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        emit WithdrawalExecuted(msg.sender, amount);
    }

    /**
     * @notice Set house fee in basis points
     */
    function setHouseFeeBps(uint16 _bps) external onlyOwner {
        houseFeeBps = _bps;
    }

    /**
     * @notice Withdraw accumulated house fees
     */
    function withdrawHouseFees(address to, uint256 amount) external onlyOwner {
        require(amount <= houseBalance, "Amount exceeds house balance");
        houseBalance -= amount;
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Retry VRF request for a game if previous request timed out
     */
    function retryDeal(uint256 gameId) external onlyOwner {
        uint256 prevRequest = gameToVrfRequest[gameId];
        require(prevRequest != 0, "No prior request");
        require(vrfRequestRandomnessHash[prevRequest] == bytes32(0), "Already fulfilled");
        require(block.timestamp >= vrfRequestTimestamp[prevRequest] + vrfResponseTimeout, "Not timed out");

        uint256 newRequestId = vrfCoordinator.requestRandomWords(
            vrfKeyHash,
            vrfSubscriptionId,
            vrfRequestConfirmations,
            vrfCallbackGasLimit,
            9
        );

        vrfRequestToGame[newRequestId] = gameId;
        gameToVrfRequest[gameId] = newRequestId;
        vrfRequestTimestamp[newRequestId] = block.timestamp;
    }

    function _decodeCard(uint8 encoded) internal pure returns (PokerHandEvaluator.Card memory) {
        return PokerHandEvaluator.Card({
            rank: (encoded / 4) + 2,  // 0-12 -> 2-14
            suit: encoded % 4
        });
    }

    function _evaluateAIHandStrength(uint256 gameId) internal view returns (uint256) {
        Game storage game = games[gameId];
        
        // Simplified hand strength calculation (0-100)
        uint8 card1Rank = (game.aiCards[0] / 4) + 2;
        uint8 card2Rank = (game.aiCards[1] / 4) + 2;
        bool suited = (game.aiCards[0] % 4) == (game.aiCards[1] % 4);
        bool paired = card1Rank == card2Rank;
        
        uint256 strength = 0;
        
        if (paired) {
            strength = 50 + (card1Rank - 2) * 4; // Pairs: 50-98
        } else {
            uint8 high = card1Rank > card2Rank ? card1Rank : card2Rank;
            uint8 low = card1Rank > card2Rank ? card2Rank : card1Rank;
            strength = (high * 3) + (low * 2);
            if (suited) strength += 10;
            if (high - low == 1) strength += 5; // Connected
        }

        // Adjust based on community cards if available
        if (game.communityCardCount > 0) {
            // This would be more sophisticated in production
            strength = (strength + 50) / 2;
        }

        return strength > 100 ? 100 : strength;
    }

    function _cardToString(uint8 encoded) internal pure returns (string memory) {
        string[13] memory ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
        string[4] memory suits = ["h", "d", "c", "s"];
        
        uint8 rank = encoded / 4;
        uint8 suit = encoded % 4;
        
        return string(abi.encodePacked(ranks[rank], suits[suit]));
    }

    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // ============ View Functions ============

    function getGameState(uint256 gameId) external view returns (
        address player,
        uint256 playerChips,
        uint256 aiChips,
        uint256 pot,
        uint256 currentBet,
        GamePhase phase,
        bool playerTurn
    ) {
        Game storage game = games[gameId];
        return (
            game.player,
            game.playerChips,
            game.aiChips,
            game.pot,
            game.currentBet,
            game.phase,
            game.playerTurn
        );
    }

    function getPlayerCards(uint256 gameId) external view returns (uint8[2] memory) {
        require(games[gameId].player == msg.sender, "Not your game");
        return games[gameId].playerCards;
    }

    function getCommunityCards(uint256 gameId) external view returns (uint8[] memory) {
        Game storage game = games[gameId];
        uint8[] memory cards = new uint8[](game.communityCardCount);
        for (uint i = 0; i < game.communityCardCount; i++) {
            cards[i] = game.communityCards[i];
        }
        return cards;
    }

    // ============ Admin Functions ============

    function setMinMaxBuyIn(uint256 _min, uint256 _max) external onlyOwner {
        minBuyIn = _min;
        maxBuyIn = _max;
    }

    function setBlinds(uint256 _small, uint256 _big) external onlyOwner {
        smallBlind = _small;
        bigBlind = _big;
    }

    function setAITimeout(uint256 _timeout) external onlyOwner {
        aiResponseTimeout = _timeout;
    }

    function fundAIBank() external payable onlyOwner {}

    function withdrawAIBank(uint256 amount) external onlyOwner {
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
    }

    // ============ Chainlink Functions Callback ============

    /**
     * @notice Callback for Chainlink Functions responses
     * @dev Currently AI decisions are simulated on-chain via _simulateAIDecision.
     *      When switching to real Chainlink Functions, parse the response here
     *      and call _executeAIAction with the decoded action.
     */
    function _fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        uint256 gameId = functionsRequestToGame[requestId];
        if (gameId == 0) return; // unknown request

        // TODO: Parse LLM response from `response` bytes and execute AI action
        // For now this is a no-op since we use _simulateAIDecision instead
    }

    receive() external payable {}
}
