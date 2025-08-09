// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./ICreditScoringEngine.sol";

/**
 * @title ICreditCertificate
 * @dev Interface for Dynamic NFT Credit Certificates
 * Extends ERC721 with dynamic metadata capabilities and credit score integration
 */
interface ICreditCertificate is IERC721 {
    // Enums
    enum CreditTier { 
        BRONZE,    // 0-299 composite score
        SILVER,    // 300-499 composite score  
        GOLD,      // 500-699 composite score
        PLATINUM,  // 700-849 composite score
        DIAMOND    // 850-1000 composite score
    }

    // Structs
    struct CertificateMetadata {
        address owner;
        uint256 compositeScore;
        uint256 overallConfidence;
        CreditTier tier;
        string[] achievementBadges;
        uint256 lastUpdated;
        string ipfsHash;
        bool needsUpdate;
    }

    struct TierThresholds {
        uint256 bronze;
        uint256 silver;
        uint256 gold;
        uint256 platinum;
        uint256 diamond;
    }

    // Events
    event CertificateMinted(address indexed owner, uint256 indexed tokenId, CreditTier tier);
    event MetadataUpdated(uint256 indexed tokenId, string newIpfsHash, CreditTier newTier);
    event TierUpgraded(uint256 indexed tokenId, CreditTier oldTier, CreditTier newTier);
    event AchievementBadgeAdded(uint256 indexed tokenId, string badge);
    event UpdateRequested(uint256 indexed tokenId, address indexed requester);

    /**
     * @dev Mints a new credit certificate NFT for a user
     * @param to The address to mint the certificate to
     * @return tokenId The ID of the newly minted token
     */
    function mintCertificate(address to) external returns (uint256 tokenId);

    /**
     * @dev Updates the metadata for a certificate based on current credit scores
     * @param tokenId The ID of the token to update
     */
    function updateMetadata(uint256 tokenId) external;

    /**
     * @dev Requests an update for a certificate (can be called by anyone)
     * @param tokenId The ID of the token to request update for
     */
    function requestUpdate(uint256 tokenId) external;

    /**
     * @dev Adds an achievement badge to a certificate
     * @param tokenId The ID of the token
     * @param badge The achievement badge to add
     */
    function addAchievementBadge(uint256 tokenId, string calldata badge) external;

    /**
     * @dev Gets the complete metadata for a certificate
     * @param tokenId The ID of the token
     * @return metadata The certificate metadata
     */
    function getCertificateMetadata(uint256 tokenId) external view returns (CertificateMetadata memory metadata);

    /**
     * @dev Gets the credit tier for a given composite score
     * @param compositeScore The composite credit score
     * @return tier The corresponding credit tier
     */
    function getCreditTier(uint256 compositeScore) external view returns (CreditTier tier);

    /**
     * @dev Checks if a certificate needs updating based on time elapsed
     * @param tokenId The ID of the token
     * @return needsUpdate Whether the certificate needs updating
     * @return timeSinceUpdate Time elapsed since last update in seconds
     */
    function checkUpdateNeeded(uint256 tokenId) external view returns (bool needsUpdate, uint256 timeSinceUpdate);

    /**
     * @dev Gets the IPFS hash for a certificate's metadata
     * @param tokenId The ID of the token
     * @return ipfsHash The IPFS hash of the metadata
     */
    function getMetadataHash(uint256 tokenId) external view returns (string memory ipfsHash);

    /**
     * @dev Gets all certificates owned by an address
     * @param owner The address to query
     * @return tokenIds Array of token IDs owned by the address
     */
    function getCertificatesByOwner(address owner) external view returns (uint256[] memory tokenIds);

    /**
     * @dev Gets tier distribution statistics
     * @return bronzeCount Number of bronze certificates
     * @return silverCount Number of silver certificates  
     * @return goldCount Number of gold certificates
     * @return platinumCount Number of platinum certificates
     * @return diamondCount Number of diamond certificates
     */
    function getTierDistribution() external view returns (
        uint256 bronzeCount,
        uint256 silverCount,
        uint256 goldCount,
        uint256 platinumCount,
        uint256 diamondCount
    );
}