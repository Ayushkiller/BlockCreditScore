// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimpleCreditScore
 * @dev Simplified credit scoring system for testnet deployment
 */
contract SimpleCreditScore is Ownable, ReentrancyGuard {
    // Constants
    uint256 public constant MAX_SCORE = 1000;
    uint256 public constant MAX_CONFIDENCE = 100;
    
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

    struct CreditProfile {
        address userAddress;
        address[] linkedWallets;
        mapping(CreditDimension => ScoreDimensionData) dimensions;
        uint256 lastUpdated;
        bool exists;
    }

    // State variables
    mapping(address => CreditProfile) private creditProfiles;
    mapping(address => bool) public authorizedUpdaters;
    
    // Events
    event CreditProfileCreated(address indexed user);
    event ScoreDimensionUpdated(
        address indexed user, 
        CreditDimension dimension, 
        uint256 newScore, 
        uint256 confidence
    );
    event WalletLinked(address indexed user, address indexed linkedWallet);

    // Modifiers
    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {
        // Owner is automatically authorized
        authorizedUpdaters[msg.sender] = true;
    }

    /**
     * @dev Creates a new credit profile for a user
     */
    function createCreditProfile(address user) external onlyAuthorized {
        require(!creditProfiles[user].exists, "Profile already exists");
        
        CreditProfile storage profile = creditProfiles[user];
        profile.userAddress = user;
        profile.lastUpdated = block.timestamp;
        profile.exists = true;
        
        // Initialize all dimensions with insufficient data flag
        for (uint256 i = 0; i < 5; i++) {
            CreditDimension dimension = CreditDimension(i);
            profile.dimensions[dimension] = ScoreDimensionData({
                score: 0,
                confidence: 0,
                dataPoints: 0,
                trend: ScoreTrend.STABLE,
                lastCalculated: block.timestamp,
                hasInsufficientData: true
            });
        }
        
        emit CreditProfileCreated(user);
    }

    /**
     * @dev Updates a specific credit dimension for a user
     */
    function updateScoreDimension(
        address user,
        CreditDimension dimension,
        uint256[] calldata rawData,
        uint256[] calldata weights
    ) external onlyAuthorized nonReentrant {
        require(creditProfiles[user].exists, "Profile does not exist");
        require(rawData.length > 0, "No data provided");
        
        CreditProfile storage profile = creditProfiles[user];
        ScoreDimensionData storage dimensionData = profile.dimensions[dimension];
        
        // Simple scoring calculation
        uint256 newScore = _calculateSimpleScore(rawData);
        uint256 confidence = rawData.length >= 5 ? 80 : (rawData.length * 20);
        
        // Determine trend
        ScoreTrend newTrend = _calculateTrend(dimensionData.score, newScore);
        
        // Update dimension data
        dimensionData.score = newScore;
        dimensionData.confidence = confidence;
        dimensionData.dataPoints = rawData.length;
        dimensionData.trend = newTrend;
        dimensionData.lastCalculated = block.timestamp;
        dimensionData.hasInsufficientData = rawData.length < 5;
        
        profile.lastUpdated = block.timestamp;
        
        emit ScoreDimensionUpdated(user, dimension, newScore, confidence);
    }

    /**
     * @dev Simple score calculation
     */
    function _calculateSimpleScore(uint256[] memory data) private pure returns (uint256) {
        if (data.length == 0) return 0;
        
        uint256 sum = 0;
        for (uint256 i = 0; i < data.length; i++) {
            sum += data[i];
        }
        
        uint256 average = sum / data.length;
        return average > MAX_SCORE ? MAX_SCORE : average;
    }

    /**
     * @dev Calculates trend based on previous and current scores
     */
    function _calculateTrend(uint256 previousScore, uint256 currentScore) private pure returns (ScoreTrend) {
        if (currentScore > previousScore + 10) {
            return ScoreTrend.IMPROVING;
        } else if (previousScore > currentScore + 10) {
            return ScoreTrend.DECLINING;
        } else {
            return ScoreTrend.STABLE;
        }
    }

    // View functions
    
    /**
     * @dev Gets the complete credit profile for a user
     */
    function getCreditProfile(address user) external view returns (
        bool exists,
        address userAddress,
        uint256 lastUpdated
    ) {
        CreditProfile storage profile = creditProfiles[user];
        return (
            profile.exists,
            profile.userAddress,
            profile.lastUpdated
        );
    }

    /**
     * @dev Gets a specific credit dimension for a user
     */
    function getScoreDimension(address user, CreditDimension dimension) external view returns (
        uint256 score,
        uint256 confidence,
        uint256 dataPoints,
        ScoreTrend trend,
        uint256 lastCalculated,
        bool hasInsufficientData
    ) {
        require(creditProfiles[user].exists, "Profile does not exist");
        
        ScoreDimensionData storage dimensionData = creditProfiles[user].dimensions[dimension];
        return (
            dimensionData.score,
            dimensionData.confidence,
            dimensionData.dataPoints,
            dimensionData.trend,
            dimensionData.lastCalculated,
            dimensionData.hasInsufficientData
        );
    }

    /**
     * @dev Gets composite score (simplified)
     */
    function getCompositeScore(address user) external view returns (uint256 compositeScore, uint256 overallConfidence) {
        require(creditProfiles[user].exists, "Profile does not exist");
        
        CreditProfile storage profile = creditProfiles[user];
        
        uint256 totalScore = 0;
        uint256 totalConfidence = 0;
        uint256 validDimensions = 0;
        
        for (uint256 i = 0; i < 5; i++) {
            CreditDimension dimension = CreditDimension(i);
            ScoreDimensionData storage dimensionData = profile.dimensions[dimension];
            
            if (!dimensionData.hasInsufficientData) {
                totalScore += dimensionData.score;
                totalConfidence += dimensionData.confidence;
                validDimensions++;
            }
        }
        
        if (validDimensions > 0) {
            compositeScore = totalScore / validDimensions;
            overallConfidence = totalConfidence / validDimensions;
        } else {
            compositeScore = 0;
            overallConfidence = 0;
        }
        
        return (compositeScore, overallConfidence);
    }

    // Admin functions
    
    /**
     * @dev Adds an authorized updater
     */
    function addAuthorizedUpdater(address updater) external onlyOwner {
        require(updater != address(0), "Invalid address");
        authorizedUpdaters[updater] = true;
    }

    /**
     * @dev Removes an authorized updater
     */
    function removeAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
    }
}