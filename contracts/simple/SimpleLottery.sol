// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleLottery
 * @notice Simplified lottery with commit-reveal randomness (simulates Chainlink VRF)
 * @dev Deploy on Sepolia via Remix. Demonstrates:
 *      - Commit-reveal verifiable randomness
 *      - Prize pool & house edge (2%)
 *      - Min/max bet limits
 *      - Automated payout
 *      - VRF request/retry pattern
 *      - Randomness proof display
 */
contract SimpleLottery {
    // ============ Structs ============
    struct Ticket {
        address player;
        uint8[5] mainNumbers;
        uint8 powerball;
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
        bytes32 commitHash;      // commit-reveal: owner commits hash before draw
        bytes32 revealedSeed;    // revealed seed after draw
        bytes32 randomnessProof; // keccak256 of final random words for transparency
    }

    // ============ State Variables ============
    address public owner;
    uint256 public currentRoundId;
    uint256 public ticketPrice;
    uint256 public minBet;
    uint256 public maxBet;
    uint256 public drawInterval;
    uint256 public nextDrawTime;
    uint16  public houseFeeBps;     // basis points (200 = 2%)
    uint256 public houseBalance;
    uint256 public totalTickets;

    // VRF simulation
    uint256 public vrfRequestId;
    bool    public vrfPending;
    uint256 public vrfRequestTime;
    uint256 public vrfTimeout;

    mapping(uint256 => Round) public rounds;
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => mapping(address => uint256[])) public playerTickets;
    mapping(address => uint256) public pendingWithdrawals;

    // ============ Events ============
    event TicketPurchased(address indexed player, uint256 indexed roundId, uint256 ticketId, uint8[5] mainNumbers, uint8 powerball);
    event DrawRequested(uint256 indexed roundId, uint256 requestId);
    event RandomnessRevealed(uint256 indexed roundId, bytes32 randomnessProof);
    event DrawCompleted(uint256 indexed roundId, uint8[5] winningMainNumbers, uint8 winningPowerball);
    event PrizeClaimed(address indexed player, uint256 indexed ticketId, uint256 amount, uint8 tier);
    event RoundStarted(uint256 indexed roundId, uint256 drawTime);
    event JackpotRollover(uint256 indexed fromRound, uint256 indexed toRound, uint256 amount);
    event CommitPosted(uint256 indexed roundId, bytes32 commitHash);
    event VRFRetry(uint256 indexed roundId, uint256 newRequestId);
    event WithdrawalExecuted(address indexed user, uint256 amount);
    event HouseFeeCollected(uint256 amount);

    // ============ Modifiers ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ============ Constructor ============
    constructor() {
        owner = msg.sender;
        ticketPrice = 0.001 ether;
        minBet = 0.001 ether;
        maxBet = 0.1 ether;
        drawInterval = 5 minutes;  // short for demo
        houseFeeBps = 200;         // 2% house edge
        vrfTimeout = 3 minutes;
        _startNewRound();
    }

    // ============ External Functions ============

    /**
     * @notice Buy a lottery ticket with chosen numbers
     */
    function buyTicket(uint8[5] calldata mainNumbers, uint8 powerball) external payable {
        require(msg.value >= minBet && msg.value <= maxBet, "Bet outside limits");
        require(msg.value >= ticketPrice, "Insufficient payment");
        require(block.timestamp < nextDrawTime, "Round closed");

        // Validate numbers
        for (uint i = 0; i < 5; i++) {
            require(mainNumbers[i] >= 1 && mainNumbers[i] <= 69, "Invalid main number");
            for (uint j = i + 1; j < 5; j++) {
                require(mainNumbers[i] != mainNumbers[j], "Duplicate number");
            }
        }
        require(powerball >= 1 && powerball <= 26, "Invalid powerball");

        // Apply house fee
        uint256 fee = (msg.value * houseFeeBps) / 10000;
        uint256 net = msg.value - fee;
        houseBalance += fee;

        // Create ticket
        uint256 ticketId = totalTickets++;
        tickets[ticketId] = Ticket(msg.sender, mainNumbers, powerball, currentRoundId, false);
        rounds[currentRoundId].prizePool += net;
        rounds[currentRoundId].ticketCount++;
        playerTickets[currentRoundId][msg.sender].push(ticketId);

        emit TicketPurchased(msg.sender, currentRoundId, ticketId, mainNumbers, powerball);
        emit HouseFeeCollected(fee);
    }

    /**
     * @notice Quick pick - contract generates pseudo-random numbers
     */
    function buyQuickPick() external payable {
        require(msg.value >= minBet && msg.value <= maxBet, "Bet outside limits");
        require(msg.value >= ticketPrice, "Insufficient payment");
        require(block.timestamp < nextDrawTime, "Round closed");

        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, totalTickets)));
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

        // Sort
        for (uint i = 0; i < 4; i++) {
            for (uint j = i + 1; j < 5; j++) {
                if (mainNumbers[i] > mainNumbers[j]) {
                    (mainNumbers[i], mainNumbers[j]) = (mainNumbers[j], mainNumbers[i]);
                }
            }
        }

        uint8 powerball = uint8((seed % 26) + 1);

        uint256 fee = (msg.value * houseFeeBps) / 10000;
        uint256 net = msg.value - fee;
        houseBalance += fee;

        uint256 ticketId = totalTickets++;
        tickets[ticketId] = Ticket(msg.sender, mainNumbers, powerball, currentRoundId, false);
        rounds[currentRoundId].prizePool += net;
        rounds[currentRoundId].ticketCount++;
        playerTickets[currentRoundId][msg.sender].push(ticketId);

        emit TicketPurchased(msg.sender, currentRoundId, ticketId, mainNumbers, powerball);
    }

    // ============ Commit-Reveal VRF Pattern ============

    /**
     * @notice Owner commits a hash before draw (simulates VRF request)
     */
    function commitDraw(bytes32 _commitHash) external onlyOwner {
        require(block.timestamp >= nextDrawTime, "Too early");
        require(!rounds[currentRoundId].drawn, "Already drawn");

        rounds[currentRoundId].commitHash = _commitHash;
        rounds[currentRoundId].drawn = true;
        vrfRequestId++;
        vrfPending = true;
        vrfRequestTime = block.timestamp;

        emit CommitPosted(currentRoundId, _commitHash);
        emit DrawRequested(currentRoundId, vrfRequestId);
    }

    /**
     * @notice Owner reveals seed to complete the draw (simulates VRF fulfillment)
     */
    function revealDraw(bytes32 _seed) external onlyOwner {
        Round storage round = rounds[currentRoundId];
        require(round.drawn && !round.finalized, "Invalid state");
        require(keccak256(abi.encodePacked(_seed)) == round.commitHash, "Seed doesn't match commit");

        round.revealedSeed = _seed;
        vrfPending = false;

        // Generate winning numbers from seed
        uint256 randomVal = uint256(_seed);
        bool[70] memory used;
        uint8[5] memory winningMain;

        for (uint i = 0; i < 5; i++) {
            uint8 num;
            uint256 s = uint256(keccak256(abi.encodePacked(randomVal, i)));
            do {
                num = uint8((s % 69) + 1);
                s = uint256(keccak256(abi.encodePacked(s)));
            } while (used[num]);
            winningMain[i] = num;
            used[num] = true;
        }

        // Sort
        for (uint i = 0; i < 4; i++) {
            for (uint j = i + 1; j < 5; j++) {
                if (winningMain[i] > winningMain[j]) {
                    (winningMain[i], winningMain[j]) = (winningMain[j], winningMain[i]);
                }
            }
        }

        uint8 winningPowerball = uint8((uint256(keccak256(abi.encodePacked(randomVal, uint256(5)))) % 26) + 1);

        round.winningMainNumbers = winningMain;
        round.winningPowerball = winningPowerball;
        round.finalized = true;

        // Randomness proof for transparency
        bytes32 proof = keccak256(abi.encodePacked(winningMain, winningPowerball, _seed));
        round.randomnessProof = proof;

        emit RandomnessRevealed(currentRoundId, proof);
        emit DrawCompleted(currentRoundId, winningMain, winningPowerball);

        // Start new round
        uint256 prevRound = currentRoundId;
        _startNewRound();

        // Rollover if no jackpot winner
        if (round.prizePool > 0) {
            uint256 rollover = (round.prizePool * 4000) / 10000; // 40% rolls over
            rounds[currentRoundId].prizePool += rollover;
            emit JackpotRollover(prevRound, currentRoundId, rollover);
        }
    }

    /**
     * @notice Retry VRF if timed out (simulates VRF retry)
     */
    function retryDraw() external onlyOwner {
        require(vrfPending, "No pending request");
        require(block.timestamp >= vrfRequestTime + vrfTimeout, "Not timed out yet");

        // Reset so owner can commit again
        rounds[currentRoundId].drawn = false;
        vrfPending = false;
        vrfRequestId++;

        emit VRFRetry(currentRoundId, vrfRequestId);
    }

    // ============ Prize Claiming ============

    function claimPrize(uint256 ticketId) external {
        Ticket storage ticket = tickets[ticketId];
        require(ticket.player == msg.sender, "Not your ticket");
        require(!ticket.claimed, "Already claimed");

        Round storage round = rounds[ticket.roundId];
        require(round.finalized, "Round not finalized");

        (uint8 tier, uint256 prize) = calculatePrize(ticketId);
        require(prize > 0, "No prize");

        ticket.claimed = true;
        pendingWithdrawals[msg.sender] += prize;

        emit PrizeClaimed(msg.sender, ticketId, prize, tier);
    }

    function withdrawPending() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nothing to withdraw");

        pendingWithdrawals[msg.sender] = 0;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");

        emit WithdrawalExecuted(msg.sender, amount);
    }

    // ============ View Functions ============

    function calculatePrize(uint256 ticketId) public view returns (uint8 tier, uint256 prize) {
        Ticket storage ticket = tickets[ticketId];
        Round storage round = rounds[ticket.roundId];
        if (!round.finalized) return (255, 0);

        uint8 mainMatches = 0;
        for (uint i = 0; i < 5; i++) {
            for (uint j = 0; j < 5; j++) {
                if (ticket.mainNumbers[i] == round.winningMainNumbers[j]) {
                    mainMatches++;
                    break;
                }
            }
        }
        bool pbMatch = ticket.powerball == round.winningPowerball;

        // Prize tiers (percentage of pool)
        if (mainMatches == 5 && pbMatch)  return (0, (round.prizePool * 4000) / 10000); // 40%
        if (mainMatches == 5)             return (1, (round.prizePool * 1000) / 10000); // 10%
        if (mainMatches == 4 && pbMatch)  return (2, (round.prizePool * 500) / 10000);  // 5%
        if (mainMatches == 4)             return (3, (round.prizePool * 200) / 10000);  // 2%
        if (mainMatches == 3 && pbMatch)  return (4, (round.prizePool * 100) / 10000);  // 1%
        if (mainMatches == 3)             return (5, (round.prizePool * 50) / 10000);   // 0.5%
        if (mainMatches == 2 && pbMatch)  return (6, (round.prizePool * 30) / 10000);   // 0.3%
        if (mainMatches == 1 && pbMatch)  return (7, (round.prizePool * 10) / 10000);   // 0.1%
        if (mainMatches == 0 && pbMatch)  return (8, (round.prizePool * 5) / 10000);    // 0.05%

        return (255, 0);
    }

    function getPlayerTickets(uint256 roundId, address player) external view returns (uint256[] memory) {
        return playerTickets[roundId][player];
    }

    function getRoundInfo(uint256 roundId) external view returns (
        uint256 startTime, uint256 drawTime,
        uint8[5] memory winningMainNumbers, uint8 winningPowerball,
        uint256 prizePool, uint256 ticketCount,
        bool drawn, bool finalized,
        bytes32 commitHash, bytes32 randomnessProof
    ) {
        Round storage r = rounds[roundId];
        return (r.startTime, r.drawTime, r.winningMainNumbers, r.winningPowerball,
                r.prizePool, r.ticketCount, r.drawn, r.finalized, r.commitHash, r.randomnessProof);
    }

    function getTicketInfo(uint256 ticketId) external view returns (
        address player, uint8[5] memory mainNumbers, uint8 powerball,
        uint256 roundId, bool claimed
    ) {
        Ticket storage t = tickets[ticketId];
        return (t.player, t.mainNumbers, t.powerball, t.roundId, t.claimed);
    }

    // ============ Admin ============

    function setTicketPrice(uint256 _price) external onlyOwner { ticketPrice = _price; }
    function setDrawInterval(uint256 _interval) external onlyOwner { drawInterval = _interval; }
    function setHouseFeeBps(uint16 _bps) external onlyOwner { require(_bps <= 1000); houseFeeBps = _bps; }

    function withdrawHouseFees(address to) external onlyOwner {
        uint256 amt = houseBalance;
        houseBalance = 0;
        (bool ok, ) = payable(to).call{value: amt}("");
        require(ok, "Transfer failed");
    }

    function emergencyWithdraw() external onlyOwner {
        (bool ok, ) = payable(owner).call{value: address(this).balance}("");
        require(ok);
    }

    // ============ Internal ============

    function _startNewRound() internal {
        currentRoundId++;
        nextDrawTime = block.timestamp + drawInterval;
        rounds[currentRoundId].startTime = block.timestamp;
        rounds[currentRoundId].drawTime = nextDrawTime;
        emit RoundStarted(currentRoundId, nextDrawTime);
    }

    receive() external payable {}
}
