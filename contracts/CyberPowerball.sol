// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CyberPowerball
 * @notice Decentralized lottery with Chainlink VRF for provably fair draws
 * @dev Implements Cyber-Powerball: 5 main numbers (1-69) + 1 powerball (1-26)
 */
contract CyberPowerball is VRFConsumerBaseV2, AutomationCompatibleInterface, Ownable, ReentrancyGuard {
    // ============ Structs ============
    
    struct Ticket {
        address player;
        uint8[5] mainNumbers;  // 5 numbers from 1-69
        uint8 powerball;       // 1 number from 1-26
        uint256 roundId;
        bool claimed;
    }

    struct Round {
        uint256 startTime;
        uint256 drawTime;
        uint8[5] winningMainNumbers;
        uint8 winningPowerball;
        uint256 prizePool;
        uint256 ticketCount;
        bool drawn;
        bool finalized;
    }

    struct PrizeTier {
        uint8 mainMatches;
        bool powerballMatch;
        uint256 prizePercentage;  // Basis points (100 = 1%)
    }

    // ============ State Variables ============
    
    // Chainlink VRF
    VRFCoordinatorV2Interface public immutable vrfCoordinator;
    uint64 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 500000;
    uint16 public requestConfirmations = 3;
    uint32 public numWords = 6; // 5 main + 1 powerball

    // Game state
    uint256 public currentRoundId;
    uint256 public ticketPrice = 0.01 ether;
    uint256 public drawInterval = 1 days;
    uint256 public nextDrawTime;

    // Mappings
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => uint256) public vrfRequestToRound;
    mapping(uint256 => mapping(address => uint256[])) public playerTickets;
    
    uint256 public totalTickets;

    // Prize tiers (9 tiers as per Powerball rules)
    PrizeTier[9] public prizeTiers;

    // ============ Events ============
    
    event TicketPurchased(
        address indexed player,
        uint256 indexed roundId,
        uint256 ticketId,
        uint8[5] mainNumbers,
        uint8 powerball
    );
    event DrawRequested(uint256 indexed roundId, uint256 requestId);
    event DrawCompleted(
        uint256 indexed roundId,
        uint8[5] winningMainNumbers,
        uint8 winningPowerball
    );
    event PrizeClaimed(
        address indexed player,
        uint256 indexed ticketId,
        uint256 amount,
        uint8 tier
    );
    event RoundStarted(uint256 indexed roundId, uint256 drawTime);
    event JackpotRollover(uint256 indexed fromRound, uint256 indexed toRound, uint256 amount);

    // ============ Errors ============
    
    error InvalidMainNumber();
    error InvalidPowerball();
    error RoundNotActive();
    error DrawNotReady();
    error AlreadyDrawn();
    error NotFinalized();
    error AlreadyClaimed();
    error NoPrize();
    error InsufficientPayment();

    // ============ Constructor ============
    
    constructor(
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;

        // Initialize prize tiers (percentages in basis points)
        // Tier 0: 5 main + PB = Jackpot (40%)
        prizeTiers[0] = PrizeTier(5, true, 4000);
        // Tier 1: 5 main = 10%
        prizeTiers[1] = PrizeTier(5, false, 1000);
        // Tier 2: 4 main + PB = 5%
        prizeTiers[2] = PrizeTier(4, true, 500);
        // Tier 3: 4 main = 2%
        prizeTiers[3] = PrizeTier(4, false, 200);
        // Tier 4: 3 main + PB = 1%
        prizeTiers[4] = PrizeTier(3, true, 100);
        // Tier 5: 3 main = 0.5%
        prizeTiers[5] = PrizeTier(3, false, 50);
        // Tier 6: 2 main + PB = 0.3%
        prizeTiers[6] = PrizeTier(2, true, 30);
        // Tier 7: 1 main + PB = 0.1%
        prizeTiers[7] = PrizeTier(1, true, 10);
        // Tier 8: PB only = 0.05%
        prizeTiers[8] = PrizeTier(0, true, 5);

        // Start first round
        _startNewRound();
    }

    // ============ External Functions ============

    /**
     * @notice Purchase a lottery ticket
     * @param mainNumbers Array of 5 main numbers (1-69)
     * @param powerball The powerball number (1-26)
     */
    function buyTicket(
        uint8[5] calldata mainNumbers,
        uint8 powerball
    ) external payable nonReentrant {
        if (msg.value < ticketPrice) revert InsufficientPayment();
        if (block.timestamp >= nextDrawTime) revert RoundNotActive();

        // Validate main numbers
        for (uint i = 0; i < 5; i++) {
            if (mainNumbers[i] < 1 || mainNumbers[i] > 69) revert InvalidMainNumber();
            // Check for duplicates
            for (uint j = i + 1; j < 5; j++) {
                if (mainNumbers[i] == mainNumbers[j]) revert InvalidMainNumber();
            }
        }

        // Validate powerball
        if (powerball < 1 || powerball > 26) revert InvalidPowerball();

        // Create ticket
        uint256 ticketId = totalTickets++;
        tickets[ticketId] = Ticket({
            player: msg.sender,
            mainNumbers: mainNumbers,
            powerball: powerball,
            roundId: currentRoundId,
            claimed: false
        });

        // Update round
        rounds[currentRoundId].prizePool += msg.value;
        rounds[currentRoundId].ticketCount++;
        playerTickets[currentRoundId][msg.sender].push(ticketId);

        emit TicketPurchased(msg.sender, currentRoundId, ticketId, mainNumbers, powerball);
    }

    /**
     * @notice Quick pick - generate random numbers for the player
     */
    function buyQuickPick() external payable nonReentrant {
        if (msg.value < ticketPrice) revert InsufficientPayment();
        if (block.timestamp >= nextDrawTime) revert RoundNotActive();

        // Generate pseudo-random numbers (for convenience, not for draw)
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            totalTickets
        )));

        uint8[5] memory mainNumbers;
        bool[70] memory used;
        
        for (uint i = 0; i < 5; i++) {
            uint8 num;
            do {
                num = uint8((uint256(keccak256(abi.encodePacked(seed, i))) % 69) + 1);
                seed = uint256(keccak256(abi.encodePacked(seed)));
            } while (used[num]);
            mainNumbers[i] = num;
            used[num] = true;
        }

        // Sort main numbers
        for (uint i = 0; i < 4; i++) {
            for (uint j = i + 1; j < 5; j++) {
                if (mainNumbers[i] > mainNumbers[j]) {
                    (mainNumbers[i], mainNumbers[j]) = (mainNumbers[j], mainNumbers[i]);
                }
            }
        }

        uint8 powerball = uint8((seed % 26) + 1);

        // Create ticket
        uint256 ticketId = totalTickets++;
        tickets[ticketId] = Ticket({
            player: msg.sender,
            mainNumbers: mainNumbers,
            powerball: powerball,
            roundId: currentRoundId,
            claimed: false
        });

        rounds[currentRoundId].prizePool += msg.value;
        rounds[currentRoundId].ticketCount++;
        playerTickets[currentRoundId][msg.sender].push(ticketId);

        emit TicketPurchased(msg.sender, currentRoundId, ticketId, mainNumbers, powerball);
    }

    /**
     * @notice Claim prize for a winning ticket
     * @param ticketId The ticket ID to claim
     */
    function claimPrize(uint256 ticketId) external nonReentrant {
        Ticket storage ticket = tickets[ticketId];
        Round storage round = rounds[ticket.roundId];

        if (!round.finalized) revert NotFinalized();
        if (ticket.claimed) revert AlreadyClaimed();
        if (ticket.player != msg.sender) revert NoPrize();

        (uint8 tier, uint256 prize) = calculatePrize(ticketId);
        if (prize == 0) revert NoPrize();

        ticket.claimed = true;

        (bool success, ) = payable(msg.sender).call{value: prize}("");
        require(success, "Transfer failed");

        emit PrizeClaimed(msg.sender, ticketId, prize, tier);
    }

    // ============ Chainlink Automation ============

    /**
     * @notice Check if upkeep is needed (for Chainlink Automation)
     */
    function checkUpkeep(bytes calldata) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory performData) 
    {
        Round storage round = rounds[currentRoundId];
        upkeepNeeded = (
            block.timestamp >= nextDrawTime &&
            !round.drawn &&
            round.ticketCount > 0
        );
        performData = "";
    }

    /**
     * @notice Perform upkeep - trigger the draw
     */
    function performUpkeep(bytes calldata) external override {
        Round storage round = rounds[currentRoundId];
        
        if (block.timestamp < nextDrawTime) revert DrawNotReady();
        if (round.drawn) revert AlreadyDrawn();

        round.drawn = true;

        // Request random numbers from Chainlink VRF
        uint256 requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        vrfRequestToRound[requestId] = currentRoundId;

        emit DrawRequested(currentRoundId, requestId);
    }

    // ============ Chainlink VRF Callback ============

    /**
     * @notice Callback function for Chainlink VRF
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 roundId = vrfRequestToRound[requestId];
        Round storage round = rounds[roundId];

        // Generate winning main numbers (1-69)
        bool[70] memory used;
        uint8[5] memory winningMain;
        
        for (uint i = 0; i < 5; i++) {
            uint8 num;
            uint256 seed = randomWords[i];
            do {
                num = uint8((seed % 69) + 1);
                seed = uint256(keccak256(abi.encodePacked(seed)));
            } while (used[num]);
            winningMain[i] = num;
            used[num] = true;
        }

        // Sort winning numbers
        for (uint i = 0; i < 4; i++) {
            for (uint j = i + 1; j < 5; j++) {
                if (winningMain[i] > winningMain[j]) {
                    (winningMain[i], winningMain[j]) = (winningMain[j], winningMain[i]);
                }
            }
        }

        // Generate winning powerball (1-26)
        uint8 winningPowerball = uint8((randomWords[5] % 26) + 1);

        round.winningMainNumbers = winningMain;
        round.winningPowerball = winningPowerball;
        round.finalized = true;

        emit DrawCompleted(roundId, winningMain, winningPowerball);

        // Check for jackpot winner, rollover if none
        bool hasJackpotWinner = _checkJackpotWinners(roundId);
        
        // Start new round
        uint256 rolloverAmount = 0;
        if (!hasJackpotWinner) {
            // Rollover jackpot portion (40%)
            rolloverAmount = (round.prizePool * 4000) / 10000;
        }
        
        _startNewRound();
        
        if (rolloverAmount > 0) {
            rounds[currentRoundId].prizePool += rolloverAmount;
            emit JackpotRollover(roundId, currentRoundId, rolloverAmount);
        }
    }

    // ============ View Functions ============

    /**
     * @notice Calculate prize for a ticket
     */
    function calculatePrize(uint256 ticketId) public view returns (uint8 tier, uint256 prize) {
        Ticket storage ticket = tickets[ticketId];
        Round storage round = rounds[ticket.roundId];

        if (!round.finalized) return (255, 0);

        // Count matches
        uint8 mainMatches = 0;
        for (uint i = 0; i < 5; i++) {
            for (uint j = 0; j < 5; j++) {
                if (ticket.mainNumbers[i] == round.winningMainNumbers[j]) {
                    mainMatches++;
                    break;
                }
            }
        }
        bool powerballMatch = ticket.powerball == round.winningPowerball;

        // Find matching tier
        for (uint8 t = 0; t < 9; t++) {
            if (prizeTiers[t].mainMatches == mainMatches && 
                prizeTiers[t].powerballMatch == powerballMatch) {
                tier = t;
                prize = (round.prizePool * prizeTiers[t].prizePercentage) / 10000;
                return (tier, prize);
            }
        }

        return (255, 0); // No prize
    }

    /**
     * @notice Get player's tickets for a round
     */
    function getPlayerTickets(uint256 roundId, address player) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return playerTickets[roundId][player];
    }

    /**
     * @notice Get round info
     */
    function getRoundInfo(uint256 roundId) external view returns (
        uint256 startTime,
        uint256 drawTime,
        uint8[5] memory winningMainNumbers,
        uint8 winningPowerball,
        uint256 prizePool,
        uint256 ticketCount,
        bool drawn,
        bool finalized
    ) {
        Round storage round = rounds[roundId];
        return (
            round.startTime,
            round.drawTime,
            round.winningMainNumbers,
            round.winningPowerball,
            round.prizePool,
            round.ticketCount,
            round.drawn,
            round.finalized
        );
    }

    /**
     * @notice Get ticket info
     */
    function getTicketInfo(uint256 ticketId) external view returns (
        address player,
        uint8[5] memory mainNumbers,
        uint8 powerball,
        uint256 roundId,
        bool claimed
    ) {
        Ticket storage ticket = tickets[ticketId];
        return (
            ticket.player,
            ticket.mainNumbers,
            ticket.powerball,
            ticket.roundId,
            ticket.claimed
        );
    }

    // ============ Internal Functions ============

    function _startNewRound() internal {
        currentRoundId++;
        nextDrawTime = block.timestamp + drawInterval;
        
        rounds[currentRoundId] = Round({
            startTime: block.timestamp,
            drawTime: nextDrawTime,
            winningMainNumbers: [uint8(0), 0, 0, 0, 0],
            winningPowerball: 0,
            prizePool: 0,
            ticketCount: 0,
            drawn: false,
            finalized: false
        });

        emit RoundStarted(currentRoundId, nextDrawTime);
    }

    function _checkJackpotWinners(uint256 roundId) internal view returns (bool) {
        Round storage round = rounds[roundId];
        
        // Check all tickets for jackpot (5 main + powerball)
        for (uint256 i = 0; i < totalTickets; i++) {
            if (tickets[i].roundId != roundId) continue;
            
            uint8 matches = 0;
            for (uint j = 0; j < 5; j++) {
                for (uint k = 0; k < 5; k++) {
                    if (tickets[i].mainNumbers[j] == round.winningMainNumbers[k]) {
                        matches++;
                        break;
                    }
                }
            }
            
            if (matches == 5 && tickets[i].powerball == round.winningPowerball) {
                return true;
            }
        }
        
        return false;
    }

    // ============ Admin Functions ============

    function setTicketPrice(uint256 _price) external onlyOwner {
        ticketPrice = _price;
    }

    function setDrawInterval(uint256 _interval) external onlyOwner {
        drawInterval = _interval;
    }

    function setVRFConfig(
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit
    ) external onlyOwner {
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
    }

    /**
     * @notice Emergency withdraw (only for stuck funds)
     */
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
}
