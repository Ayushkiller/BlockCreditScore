// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICreditScoringEngine
 * @dev Interface for the Credit Scoring Engine
 * Defines the standard functions for credit profile management and scoring
 */
interface ICreditScoringEngine {
    // Enums
    enum ScoreTrend { IMPROVING, STABLE, DECLINING }
    enum CreditDimension { 
        DEFI_RELIABILITY, 
        TRADING_CONSISTENCY, 
        STAKING_COMMITMENT, 
        GOVERNANCE_PARTICIPATION, 
        LIQUIDITY_PROVIDER 
    }

    // Structs
    struct ScoreDimensionData {
        uint256 score;           // 0-1000 scale
        uint256 confidence;      // 0-100 percentage
        uint256 dataPoints;      // Number of data points used
        ScoreTrend trend;        // Score trend direction
        uint256 lastCalculated; // Timestamp of last calculation
        bool hasInsufficientData; // Flag for insufficient data
    }

    struct DimensionWeights {
        uint256 defiReliability;
        uint256 tradingConsistency;
        uint256 stakingCommitment;
        uint256 governanceParticipation;
        uint256 liquidityProvider;
    }

    // Events
    event CreditProfileCreated(address indexed user);
    event ScoreDimensionUpdated(
        address indexed user, 
        CreditDimension dimension, 
        uint256 newScore, 
        uint256 confidence
    );
    event WalletLinked(address indexed user, address indexed linkedWallet);

    /**
     * @dev Creates a new credit profile for a user
     * @param user The address of the user
     */
    function createCreditProfile(address user) external;

    /**
     * @dev Updates a specific credit dimension for a user
     * @param user The address of the user
     * @param dimension The credit dimension to update
     * @param rawData Array of data points for calculation
     * @param weights Custom weights for this calculation
     */
    function updateScoreDimension(
        address user,
        CreditDimension dimension,
        uint256[] calldata rawData,
        uint256[] calldata weights
    ) external;

    /**
     * @dev Links additional wallets to a user's credit profile
     * @param user The primary user address
     * @param walletToLink The wallet address to link
     */
    function linkWallet(address user, address walletToLink) external;

    /**
     * @dev Gets the complete credit profile for a user
     * @param user The address of the user
     * @return exists Whether the profile exists
     * @return userAddress The user's address
     * @return lastUpdated Timestamp of last update
     */
    function getCreditProfile(address user) external view returns (
        bool exists,
        address userAddress,
        uint256 lastUpdated
    );

    /**
     * @dev Gets a specific credit dimension for a user
     * @param user The address of the user
     * @param dimension The credit dimension to retrieve
     * @return score The dimension score (0-1000)
     * @return confidence The confidence level (0-100)
     * @return dataPoints Number of data points used
     * @return trend The score trend
     * @return lastCalculated Timestamp of last calculation
     * @return hasInsufficientData Whether there's insufficient data
     */
    function getScoreDimension(address user, CreditDimension dimension) external view returns (
        uint256 score,
        uint256 confidence,
        uint256 dataPoints,
        ScoreTrend trend,
        uint256 lastCalculated,
        bool hasInsufficientData
    );

    /**
     * @dev Gets all linked wallets for a user
     * @param user The address of the user
     * @return Array of linked wallet addresses
     */
    function getLinkedWallets(address user) external view returns (address[] memory);

    /**
     * @dev Calculates composite credit score using weighted dimensions
     * @param user The address of the user
     * @param customWeights Custom weights for dimensions
     * @return compositeScore The weighted composite score
     * @return overallConfidence The overall confidence level
     */
    function getCompositeScore(
        address user,
        DimensionWeights memory customWeights
    ) external view returns (uint256 compositeScore, uint256 overallConfidence);

    /**
     * @dev Checks if a user has sufficient data for reliable scoring
     * @param user The address of the user
     * @return hasSufficientData Whether the user has sufficient data across dimensions
     * @return insufficientDimensions Array of dimensions with insufficient data
     */
    function checkDataSufficiency(address user) external view returns (
        bool hasSufficientData,
        CreditDimension[] memory insufficientDimensions
    );
}