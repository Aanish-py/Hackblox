// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReputationBadge — On-chain NFT reputation badges for GigChain freelancers
/// @notice ERC-721 badges that evolve (upgrade in-place) as freelancers earn more
contract ReputationBadge is ERC721URIStorage, Ownable {
    // ─── Badge Types ──────────────────────────────────────────────────────────────
    enum BadgeType {
        COMPLETED_GIGS,    // 0
        EARNINGS_MILESTONE, // 1
        STREAK,            // 2
        DISPUTE_FREE,      // 3
        INITIATIVE,        // 4
        SPECIAL            // 5
    }

    struct Badge {
        BadgeType badgeType;
        uint8 level;
        uint256 value;
        uint256 mintedAt;
    }

    // ─── Storage ──────────────────────────────────────────────────────────────────
    uint256 public tokenCounter;
    address public gigEscrowAddress;

    // Level thresholds for each badge type (5 levels each)
    uint256[5] public completedGigThresholds = [5, 15, 30, 50, 100];
    uint256[5] public earningsThresholds = [1e18, 5e18, 10e18, 25e18, 50e18]; // in wei
    uint256[5] public streakThresholds = [3, 5, 10, 15, 20];
    uint256[5] public disputeFreeThresholds = [5, 15, 25, 40, 60];

    // address => badgeType => tokenId (0 if not minted)
    mapping(address => mapping(uint8 => uint256)) public badgeTokenId;
    // address => badgeType => exists
    mapping(address => mapping(uint8 => bool)) public hasBadge;
    // tokenId => Badge
    mapping(uint256 => Badge) public badges;
    // address => all tokenIds
    mapping(address => uint256[]) private _userBadges;

    // ─── Events ───────────────────────────────────────────────────────────────────
    event BadgeMinted(
        address indexed recipient,
        uint8 indexed badgeType,
        uint8 level,
        uint256 tokenId
    );
    event BadgeUpgraded(
        address indexed recipient,
        uint8 indexed badgeType,
        uint8 oldLevel,
        uint8 newLevel,
        uint256 tokenId
    );
    event GigEscrowSet(address indexed gigEscrow);

    // ─── Modifiers ────────────────────────────────────────────────────────────────
    modifier onlyGigEscrow() {
        require(msg.sender == gigEscrowAddress, "ReputationBadge: Caller is not GigEscrow");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────────
    constructor() ERC721("GigChain Reputation Badge", "GCRB") Ownable(msg.sender) {}

    // ─── External Functions ───────────────────────────────────────────────────────

    /// @notice Called by GigEscrow on milestone completion — mints or upgrades badge
    function mintBadge(address recipient, uint8 badgeType, uint256 value) external onlyGigEscrow {
        require(badgeType <= uint8(BadgeType.SPECIAL), "ReputationBadge: Invalid badge type");

        if (hasBadge[recipient][badgeType]) {
            _upgradeBadgeIfEligible(recipient, badgeType, value);
        } else {
            uint8 level = _calculateLevel(badgeType, value);
            if (level == 0) return; // Not yet at threshold for level 1

            uint256 tokenId = ++tokenCounter;
            _safeMint(recipient, tokenId);
            _setTokenURI(tokenId, _buildMetadataURI(badgeType, level, value));

            badges[tokenId] = Badge({
                badgeType: BadgeType(badgeType),
                level: level,
                value: value,
                mintedAt: block.timestamp
            });

            badgeTokenId[recipient][badgeType] = tokenId;
            hasBadge[recipient][badgeType] = true;
            _userBadges[recipient].push(tokenId);

            emit BadgeMinted(recipient, badgeType, level, tokenId);
        }
    }

    /// @notice Owner grants a special badge manually (for exceptional work)
    function grantSpecialBadge(address recipient, string calldata metadataURI) external onlyOwner {
        uint256 tokenId = ++tokenCounter;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);

        badges[tokenId] = Badge({
            badgeType: BadgeType.SPECIAL,
            level: 1,
            value: 1,
            mintedAt: block.timestamp
        });

        _userBadges[recipient].push(tokenId);
        emit BadgeMinted(recipient, uint8(BadgeType.SPECIAL), 1, tokenId);
    }

    /// @notice Wire GigEscrow contract address — only owner
    function setGigEscrowAddress(address _gigEscrow) external onlyOwner {
        require(_gigEscrow != address(0), "ReputationBadge: Zero address");
        gigEscrowAddress = _gigEscrow;
        emit GigEscrowSet(_gigEscrow);
    }

    // ─── View Functions ───────────────────────────────────────────────────────────

    function getUserBadges(address user) external view returns (uint256[] memory) {
        return _userBadges[user];
    }

    function getBadgeInfo(uint256 tokenId) external view returns (
        uint8 badgeType,
        uint8 level,
        uint256 value,
        uint256 mintedAt
    ) {
        Badge memory b = badges[tokenId];
        return (uint8(b.badgeType), b.level, b.value, b.mintedAt);
    }

    function getBadgeLevel(address user, uint8 badgeType) external view returns (uint8) {
        if (!hasBadge[user][badgeType]) return 0;
        uint256 tokenId = badgeTokenId[user][badgeType];
        return badges[tokenId].level;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────────

    function _upgradeBadgeIfEligible(address recipient, uint8 badgeType, uint256 newValue) internal {
        uint256 tokenId = badgeTokenId[recipient][badgeType];
        Badge storage badge = badges[tokenId];

        uint8 newLevel = _calculateLevel(badgeType, newValue);
        badge.value = newValue;

        if (newLevel > badge.level) {
            uint8 oldLevel = badge.level;
            badge.level = newLevel;
            _setTokenURI(tokenId, _buildMetadataURI(badgeType, newLevel, newValue));
            emit BadgeUpgraded(recipient, badgeType, oldLevel, newLevel, tokenId);
        }
    }

    function _calculateLevel(uint8 badgeType, uint256 value) internal view returns (uint8) {
        uint256[5] memory thresholds = _getThresholds(badgeType);
        uint8 level = 0;
        for (uint8 i = 0; i < 5; i++) {
            if (value >= thresholds[i]) {
                level = i + 1;
            } else {
                break;
            }
        }
        return level;
    }

    function _getThresholds(uint8 badgeType) internal view returns (uint256[5] memory) {
        if (badgeType == 0) return completedGigThresholds;
        if (badgeType == 1) return earningsThresholds;
        if (badgeType == 2) return streakThresholds;
        if (badgeType == 3) return disputeFreeThresholds;
        // INITIATIVE and SPECIAL — level 1 at value >= 1
        return [uint256(1), 0, 0, 0, 0];
    }

    function _buildMetadataURI(
        uint8 badgeType,
        uint8 level,
        uint256 value
    ) internal pure returns (string memory) {
        string[6] memory typeNames = [
            "completed-gigs",
            "earnings-milestone",
            "streak",
            "dispute-free",
            "initiative",
            "special"
        ];
        return string(
            abi.encodePacked(
                "https://api.gigchain.xyz/badge/metadata/",
                typeNames[badgeType],
                "/",
                _uint2str(level),
                "?value=",
                _uint2str(value)
            )
        );
    }

    function _uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
