// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title GameNFT
 * @notice Simple ERC-721 for game achievements & passes
 * @dev Deploy on Sepolia via Remix. Demonstrates NFT-based game items.
 *      Minimal ERC-721 without OpenZeppelin to keep Remix-simple.
 */
contract GameNFT {
    string public name = "Pioneer Game NFT";
    string public symbol = "PGAME";

    address public owner;
    uint256 public totalSupply;

    enum NFTType { DoublePlayPass, NoLossPass, FirstWin, WinStreak, HighRoller, LotteryWinner }

    struct TokenInfo {
        NFTType nftType;
        uint256 mintedAt;
        string description;
    }

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;
    mapping(uint256 => TokenInfo) public tokenInfo;
    mapping(address => uint256[]) public ownedTokens;

    // Track which types each address has minted (for passes: 1 per type per address)
    mapping(address => mapping(uint256 => bool)) public hasMintedType;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event NFTMinted(address indexed to, uint256 indexed tokenId, uint8 nftType, string description);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Mint a game pass NFT (anyone can mint, 1 per type per address)
     */
    function mintPass(uint8 _type) external {
        require(_type <= 1, "Only DoublePlayPass(0) or NoLossPass(1)");
        require(!hasMintedType[msg.sender][_type], "Already minted this pass");

        string memory desc;
        if (_type == 0) desc = "Double Play Pass - Enter 2 draws per ticket";
        else desc = "NoLoss Play Pass - Principal always redeemable";

        _mint(msg.sender, NFTType(_type), desc);
        hasMintedType[msg.sender][_type] = true;
    }

    /**
     * @notice Owner can reset a user's minted status (for demo/testing)
     */
    function resetMintedType(address _addr, uint8 _type) external onlyOwner {
        hasMintedType[_addr][_type] = false;
    }

    /**
     * @notice Mint an achievement NFT (owner only, for rewarding players)
     */
    function mintAchievement(address to, uint8 _type, string calldata desc) external onlyOwner {
        require(_type >= 2 && _type <= 5, "Invalid achievement type");
        _mint(to, NFTType(_type), desc);
    }

    /**
     * @notice Check if address has a specific NFT type
     */
    function hasNFTType(address _addr, uint8 _type) external view returns (bool) {
        uint256[] memory tokens = ownedTokens[_addr];
        for (uint i = 0; i < tokens.length; i++) {
            if (uint8(tokenInfo[tokens[i]].nftType) == _type) return true;
        }
        return false;
    }

    /**
     * @notice Get all tokens owned by address
     */
    function getOwnedTokens(address _addr) external view returns (uint256[] memory) {
        return ownedTokens[_addr];
    }

    /**
     * @notice Get token metadata
     */
    function getTokenDetails(uint256 tokenId) external view returns (
        address tokenOwner, uint8 nftType, uint256 mintedAt, string memory description
    ) {
        require(ownerOf[tokenId] != address(0), "Token does not exist");
        TokenInfo storage info = tokenInfo[tokenId];
        return (ownerOf[tokenId], uint8(info.nftType), info.mintedAt, info.description);
    }

    // ============ ERC-721 Core ============

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(ownerOf[tokenId] == from, "Not owner");
        require(
            msg.sender == from ||
            msg.sender == getApproved[tokenId] ||
            isApprovedForAll[from][msg.sender],
            "Not authorized"
        );
        require(to != address(0), "Zero address");

        _transfer(from, to, tokenId);
    }

    function approve(address to, uint256 tokenId) external {
        address tokenOwner = ownerOf[tokenId];
        require(msg.sender == tokenOwner || isApprovedForAll[tokenOwner][msg.sender], "Not authorized");
        getApproved[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    // ============ Internal ============

    function _mint(address to, NFTType _type, string memory desc) internal {
        uint256 tokenId = totalSupply++;
        ownerOf[tokenId] = to;
        balanceOf[to]++;
        tokenInfo[tokenId] = TokenInfo(_type, block.timestamp, desc);
        ownedTokens[to].push(tokenId);

        emit Transfer(address(0), to, tokenId);
        emit NFTMinted(to, tokenId, uint8(_type), desc);
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        ownerOf[tokenId] = to;
        balanceOf[from]--;
        balanceOf[to]++;
        delete getApproved[tokenId];

        // Update owned tokens arrays
        _removeFromOwnedTokens(from, tokenId);
        ownedTokens[to].push(tokenId);

        emit Transfer(from, to, tokenId);
    }

    function _removeFromOwnedTokens(address _addr, uint256 tokenId) internal {
        uint256[] storage tokens = ownedTokens[_addr];
        for (uint i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }
}
