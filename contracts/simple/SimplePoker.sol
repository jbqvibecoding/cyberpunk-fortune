// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimplePoker
 * @notice Simplified poker betting contract with commit-reveal anti-cheat
 * @dev Deploy on Sepolia via Remix. Demonstrates:
 *      - Commit-reveal for anti-cheating
 *      - Time-locked reveals with penalty for timeout
 *      - Transparent result verification
 *      - ETH betting with house edge
 */
contract SimplePoker {
    enum GameStatus { None, Created, PlayerCommitted, Revealed, Finished }

    struct Game {
        address player;
        uint256 buyIn;
        uint256 pot;
        GameStatus status;
        bytes32 playerCommit;    // commit hash for anti-cheat
        uint256 commitTime;      // when commit was made
        uint256 revealDeadline;  // must reveal before this
        bytes32 revealedSeed;    // player's revealed seed
        bytes32 resultHash;      // transparent result hash
        bool playerWon;
        uint256 payout;
        string handDescription;
    }

    address public owner;
    uint256 public gameCounter;
    uint256 public minBuyIn;
    uint256 public maxBuyIn;
    uint16  public houseFeeBps;
    uint256 public houseBalance;
    uint256 public revealTimeout;  // seconds to reveal before penalty

    mapping(uint256 => Game) public games;
    mapping(address => uint256) public activeGame;
    mapping(address => uint256) public playerWins;
    mapping(address => uint256) public playerLosses;
    mapping(address => uint256) public totalWagered;

    // Anti-cheat: penalized deposits
    mapping(address => uint256) public penalties;

    // ============ Events ============
    event GameCreated(uint256 indexed gameId, address indexed player, uint256 buyIn);
    event PlayerCommitted(uint256 indexed gameId, bytes32 commitHash);
    event PlayerRevealed(uint256 indexed gameId, bytes32 seed);
    event GameResult(uint256 indexed gameId, bool playerWon, uint256 payout, string handDescription, bytes32 resultHash);
    event PenaltyApplied(uint256 indexed gameId, address indexed player, uint256 amount);
    event Withdrawal(address indexed player, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        minBuyIn = 0.001 ether;
        maxBuyIn = 0.1 ether;
        houseFeeBps = 200;        // 2%
        revealTimeout = 3 minutes; // short for demo
    }

    /**
     * @notice Start a new poker game with ETH buy-in
     */
    function startGame() external payable {
        require(msg.value >= minBuyIn && msg.value <= maxBuyIn, "Buy-in outside limits");
        require(activeGame[msg.sender] == 0, "Already in game");

        gameCounter++;
        uint256 gid = gameCounter;

        uint256 fee = (msg.value * houseFeeBps) / 10000;
        uint256 net = msg.value - fee;
        houseBalance += fee;

        games[gid] = Game({
            player: msg.sender,
            buyIn: net,
            pot: net * 2,  // simulate AI matching buy-in
            status: GameStatus.Created,
            playerCommit: bytes32(0),
            commitTime: 0,
            revealDeadline: 0,
            revealedSeed: bytes32(0),
            resultHash: bytes32(0),
            playerWon: false,
            payout: 0,
            handDescription: ""
        });

        activeGame[msg.sender] = gid;
        totalWagered[msg.sender] += msg.value;

        emit GameCreated(gid, msg.sender, msg.value);
    }

    /**
     * @notice Player commits a hash (anti-cheat: hash of their secret seed)
     */
    function commitAction(bytes32 _commitHash) external {
        uint256 gid = activeGame[msg.sender];
        require(gid != 0, "No active game");
        Game storage g = games[gid];
        require(g.status == GameStatus.Created, "Wrong phase");

        g.playerCommit = _commitHash;
        g.commitTime = block.timestamp;
        g.revealDeadline = block.timestamp + revealTimeout;
        g.status = GameStatus.PlayerCommitted;

        emit PlayerCommitted(gid, _commitHash);
    }

    /**
     * @notice Player reveals their seed - must match commit
     */
    function revealAction(bytes32 _seed) external {
        uint256 gid = activeGame[msg.sender];
        require(gid != 0, "No active game");
        Game storage g = games[gid];
        require(g.status == GameStatus.PlayerCommitted, "Must commit first");
        require(block.timestamp <= g.revealDeadline, "Reveal deadline passed");
        require(keccak256(abi.encodePacked(_seed)) == g.playerCommit, "Seed doesn't match commit");

        g.revealedSeed = _seed;
        g.status = GameStatus.Revealed;

        emit PlayerRevealed(gid, _seed);

        // Auto-resolve the game
        _resolveGame(gid);
    }

    /**
     * @notice Penalize player for not revealing in time (anti-cheat)
     */
    function claimTimeout(uint256 gid) external {
        Game storage g = games[gid];
        require(g.status == GameStatus.PlayerCommitted, "Not in commit phase");
        require(block.timestamp > g.revealDeadline, "Deadline not passed");

        // Penalty: forfeit buy-in
        g.status = GameStatus.Finished;
        g.playerWon = false;
        g.handDescription = "TIMEOUT - Forfeited";
        penalties[g.player] += g.buyIn;
        houseBalance += g.buyIn;
        activeGame[g.player] = 0;

        emit PenaltyApplied(gid, g.player, g.buyIn);
        emit GameResult(gid, false, 0, "TIMEOUT - Forfeited", bytes32(0));
    }

    /**
     * @notice Quick play - skip commit/reveal, just play (for demo convenience)
     */
    function quickPlay() external payable {
        require(msg.value >= minBuyIn && msg.value <= maxBuyIn, "Buy-in outside limits");
        require(activeGame[msg.sender] == 0, "Already in game");

        gameCounter++;
        uint256 gid = gameCounter;

        uint256 fee = (msg.value * houseFeeBps) / 10000;
        uint256 net = msg.value - fee;
        houseBalance += fee;

        games[gid] = Game({
            player: msg.sender,
            buyIn: net,
            pot: net * 2,
            status: GameStatus.Revealed,
            playerCommit: bytes32(0),
            commitTime: block.timestamp,
            revealDeadline: 0,
            revealedSeed: keccak256(abi.encodePacked(block.timestamp, msg.sender, gid)),
            resultHash: bytes32(0),
            playerWon: false,
            payout: 0,
            handDescription: ""
        });

        activeGame[msg.sender] = gid;
        totalWagered[msg.sender] += msg.value;

        emit GameCreated(gid, msg.sender, msg.value);

        _resolveGame(gid);
    }

    // ============ View Functions ============

    function getGameInfo(uint256 gid) external view returns (
        address player, uint256 buyIn, uint256 pot,
        uint8 status, bool playerWon, uint256 payout,
        string memory handDescription, bytes32 resultHash,
        bytes32 playerCommit, uint256 revealDeadline
    ) {
        Game storage g = games[gid];
        return (g.player, g.buyIn, g.pot, uint8(g.status), g.playerWon, g.payout,
                g.handDescription, g.resultHash, g.playerCommit, g.revealDeadline);
    }

    function getPlayerStats(address player) external view returns (
        uint256 wins, uint256 losses, uint256 wagered
    ) {
        return (playerWins[player], playerLosses[player], totalWagered[player]);
    }

    // ============ Internal ============

    function _resolveGame(uint256 gid) internal {
        Game storage g = games[gid];

        // Generate result from combined entropy
        uint256 entropy = uint256(keccak256(abi.encodePacked(
            g.revealedSeed,
            block.timestamp,
            block.prevrandao,
            gid
        )));

        // Determine outcome (slightly favor player for demo - 55% win rate)
        bool won = (entropy % 100) < 55;

        // Generate hand description
        string memory desc;
        uint256 handType = entropy % 10;
        if (handType < 1) desc = "Royal Flush";
        else if (handType < 2) desc = "Straight Flush";
        else if (handType < 3) desc = "Four of a Kind";
        else if (handType < 4) desc = "Full House";
        else if (handType < 5) desc = "Flush";
        else if (handType < 6) desc = "Straight";
        else if (handType < 7) desc = "Three of a Kind";
        else if (handType < 8) desc = "Two Pair";
        else if (handType < 9) desc = "One Pair";
        else desc = "High Card";

        g.playerWon = won;
        g.handDescription = desc;
        g.resultHash = keccak256(abi.encodePacked(entropy, won, desc));
        g.status = GameStatus.Finished;

        if (won) {
            g.payout = g.pot;
            playerWins[g.player]++;
            (bool ok, ) = payable(g.player).call{value: g.pot}("");
            require(ok, "Payout failed");
        } else {
            g.payout = 0;
            playerLosses[g.player]++;
            houseBalance += g.buyIn; // house keeps AI's "side"
        }

        activeGame[g.player] = 0;
        emit GameResult(gid, won, g.payout, desc, g.resultHash);
    }

    // ============ Admin ============

    function setMinBuyIn(uint256 _min) external onlyOwner { minBuyIn = _min; }
    function setMaxBuyIn(uint256 _max) external onlyOwner { maxBuyIn = _max; }
    function setHouseFeeBps(uint16 _bps) external onlyOwner { require(_bps <= 1000); houseFeeBps = _bps; }
    function setRevealTimeout(uint256 _t) external onlyOwner { revealTimeout = _t; }

    function withdrawHouseFees(address to) external onlyOwner {
        uint256 amt = houseBalance;
        houseBalance = 0;
        (bool ok, ) = payable(to).call{value: amt}("");
        require(ok);
    }

    function emergencyWithdraw() external onlyOwner {
        (bool ok, ) = payable(owner).call{value: address(this).balance}("");
        require(ok);
    }

    // Fund the contract (for AI matching)
    receive() external payable {}
}
