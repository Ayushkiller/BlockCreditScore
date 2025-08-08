// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CreditScore
 * @dev A simple contract to store and manage crypto credit scores.
 * This is a basic implementation for the hackathon.
 */
contract CreditScore {
    // Mapping from user address to their credit score
    mapping(address => uint256) public creditScores;

    // Event to be emitted when a credit score is updated
    event CreditScoreUpdated(address indexed user, uint256 newScore);

    /**
     * @dev Updates the credit score for a given user.
     * In a real implementation, this would be callable only by a trusted oracle or through a decentralized governance mechanism.
     * For this skeleton, we'll leave it open.
     * @param user The address of the user.
     * @param score The new credit score.
     */
    function updateCreditScore(address user, uint256 score) public {
        creditScores[user] = score;
        emit CreditScoreUpdated(user, score);
    }

    /**
     * @dev Retrieves the credit score for a given user.
     * @param user The address of the user.
     * @return The credit score of the user.
     */
    function getCreditScore(address user) public view returns (uint256) {
        return creditScores[user];
    }
}
