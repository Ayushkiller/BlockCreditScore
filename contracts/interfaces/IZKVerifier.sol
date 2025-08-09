// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ICreditScoringEngine.sol";

/**
 * @title IZKVerifier
 * @dev Interface for Zero-Knowledge Proof verification of credit scores
 * Enables privacy-preserving credit verification without revealing sensitive data
 */
interface IZKVerifier {
    // Enums
    enum PrivacyMode { 
        FULL_PRIVACY,      // Complete transaction history remains private
        SELECTIVE,         // Users choose which dimensions to reveal
        THRESHOLD_ONLY     // Only prove score above/below threshold
    }
    
    enum VerificationStatus {
        PENDING,
        VERIFIED,
        FAILED,
        EXPIRED
    }

    // Structs
    struct ZKProof {
        uint256[8] proof;      // zk-SNARK proof (8 field elements)
        uint256[2] publicInputs; // Public inputs for verification
        bytes32 proofHash;     // Hash of the proof for integrity
        uint256 timestamp;     // When proof was generated
        uint256 expiryTime;    // When proof expires
    }

    struct ThresholdProofRequest {
        address user;
        uint256 threshold;           // Minimum score to prove
        ICreditScoringEngine.CreditDimension[] dimensions; // Dimensions to include
        PrivacyMode privacyMode;
        address requester;           // Who requested the proof
        uint256 requestTime;
        bool isActive;
    }

    struct SelectiveDisclosureRequest {
        address user;
        ICreditScoringEngine.CreditDimension[] revealedDimensions;
        ICreditScoringEngine.CreditDimension[] hiddenDimensions;
        address requester;
        uint256 requestTime;
        bool isActive;
    }

    struct VerificationResult {
        bool isValid;
        VerificationStatus status;
        uint256 verifiedAt;
        bytes32 proofId;
        string failureReason;
    }

    // Events
    event ProofGenerated(
        bytes32 indexed proofId,
        address indexed user,
        address indexed requester,
        PrivacyMode privacyMode
    );
    
    event ProofVerified(
        bytes32 indexed proofId,
        bool isValid,
        VerificationStatus status
    );
    
    event ThresholdProofRequested(
        bytes32 indexed requestId,
        address indexed user,
        address indexed requester,
        uint256 threshold
    );
    
    event SelectiveDisclosureRequested(
        bytes32 indexed requestId,
        address indexed user,
        address indexed requester,
        uint256 revealedDimensionsCount
    );
    
    event FallbackVerificationUsed(
        address indexed user,
        address indexed requester,
        string reason
    );

    /**
     * @dev Generates a zero-knowledge proof for threshold verification
     * @param user The address of the user
     * @param threshold The minimum score threshold to prove
     * @param dimensions Array of dimensions to include in proof
     * @param privacyMode The privacy mode for this proof
     * @return proofId Unique identifier for the generated proof
     */
    function generateThresholdProof(
        address user,
        uint256 threshold,
        ICreditScoringEngine.CreditDimension[] calldata dimensions,
        PrivacyMode privacyMode
    ) external returns (bytes32 proofId);

    /**
     * @dev Generates a zero-knowledge proof for selective disclosure
     * @param user The address of the user
     * @param revealedDimensions Dimensions to reveal in the proof
     * @param hiddenDimensions Dimensions to keep private
     * @return proofId Unique identifier for the generated proof
     */
    function generateSelectiveDisclosureProof(
        address user,
        ICreditScoringEngine.CreditDimension[] calldata revealedDimensions,
        ICreditScoringEngine.CreditDimension[] calldata hiddenDimensions
    ) external returns (bytes32 proofId);

    /**
     * @dev Verifies a zero-knowledge proof
     * @param proofId The unique identifier of the proof to verify
     * @param proof The zk-SNARK proof data
     * @return result The verification result
     */
    function verifyProof(
        bytes32 proofId,
        ZKProof calldata proof
    ) external returns (VerificationResult memory result);

    /**
     * @dev Requests threshold proof verification from a user
     * @param user The address of the user to request proof from
     * @param threshold The minimum score threshold required
     * @param dimensions Dimensions to include in the verification
     * @param privacyMode Preferred privacy mode
     * @return requestId Unique identifier for the verification request
     */
    function requestThresholdVerification(
        address user,
        uint256 threshold,
        ICreditScoringEngine.CreditDimension[] calldata dimensions,
        PrivacyMode privacyMode
    ) external returns (bytes32 requestId);

    /**
     * @dev Requests selective disclosure verification from a user
     * @param user The address of the user to request proof from
     * @param revealedDimensions Dimensions that should be revealed
     * @return requestId Unique identifier for the verification request
     */
    function requestSelectiveDisclosure(
        address user,
        ICreditScoringEngine.CreditDimension[] calldata revealedDimensions
    ) external returns (bytes32 requestId);

    /**
     * @dev Fallback to standard verification with user consent
     * @param user The address of the user
     * @param requester The address requesting verification
     * @param reason Reason for fallback (e.g., "ZK proof generation failed")
     * @return success Whether fallback verification was successful
     * @return compositeScore The user's composite credit score (if consented)
     * @return confidence The overall confidence level
     */
    function fallbackVerification(
        address user,
        address requester,
        string calldata reason
    ) external returns (
        bool success,
        uint256 compositeScore,
        uint256 confidence
    );

    /**
     * @dev Gets the status of a verification request
     * @param requestId The unique identifier of the request
     * @return isActive Whether the request is still active
     * @return user The user address for the request
     * @return requester The requester address
     * @return requestTime When the request was made
     */
    function getVerificationRequest(bytes32 requestId) external view returns (
        bool isActive,
        address user,
        address requester,
        uint256 requestTime
    );

    /**
     * @dev Gets a generated proof by its ID
     * @param proofId The unique identifier of the proof
     * @return proof The ZK proof data
     * @return isValid Whether the proof is still valid (not expired)
     */
    function getProof(bytes32 proofId) external view returns (
        ZKProof memory proof,
        bool isValid
    );

    /**
     * @dev Checks if a proof meets the threshold requirements
     * @param proofId The unique identifier of the proof
     * @param threshold The threshold to check against
     * @return meetsThreshold Whether the proof demonstrates score above threshold
     * @return confidence The confidence level of the verification
     */
    function checkThresholdCompliance(
        bytes32 proofId,
        uint256 threshold
    ) external view returns (
        bool meetsThreshold,
        uint256 confidence
    );

    /**
     * @dev Gets all active verification requests for a user
     * @param user The address of the user
     * @return requestIds Array of active request identifiers
     */
    function getActiveRequests(address user) external view returns (bytes32[] memory requestIds);

    /**
     * @dev Cancels a verification request (only by requester or user)
     * @param requestId The unique identifier of the request to cancel
     */
    function cancelVerificationRequest(bytes32 requestId) external;

    /**
     * @dev Sets user consent for fallback verification
     * @param requester The address that can use fallback verification
     * @param allowed Whether fallback is allowed for this requester
     */
    function setFallbackConsent(address requester, bool allowed) external;

    /**
     * @dev Checks if fallback verification is allowed
     * @param user The address of the user
     * @param requester The address requesting verification
     * @return allowed Whether fallback verification is permitted
     */
    function isFallbackAllowed(address user, address requester) external view returns (bool allowed);
}