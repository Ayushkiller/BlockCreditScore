---
inclusion: always
---

# Sequential Thinking Guidelines

## Problem Decomposition Strategy

When working on this crypto credit score protocol, always break complex problems into sequential, manageable steps:

### Smart Contract Development

1. **Define Requirements**: Clearly specify what the contract should accomplish
2. **Design Data Structures**: Plan state variables and their relationships
3. **Implement Core Logic**: Build functions incrementally, one feature at a time
4. **Add Security Measures**: Systematically review and implement security patterns
5. **Test Thoroughly**: Create comprehensive test cases for each function

### Credit Scoring Logic

1. **Identify Data Sources**: List all on-chain data points to aggregate
2. **Define Scoring Criteria**: Establish clear, transparent scoring rules
3. **Implement Calculations**: Build scoring algorithms step-by-step
4. **Validate Results**: Test scoring logic with known data sets
5. **Optimize Performance**: Review and improve gas efficiency

### Frontend Integration

1. **Plan User Flow**: Map out user interactions with the protocol
2. **Connect to Blockchain**: Implement web3 integration systematically
3. **Handle State Management**: Manage application state changes sequentially
4. **Add Error Handling**: Implement comprehensive error management
5. **Test User Experience**: Validate each interaction path

## Systematic Analysis Approach

- **Before Implementation**: Always analyze requirements, constraints, and dependencies
- **During Development**: Follow the Checks-Effects-Interactions pattern for security
- **After Implementation**: Review code for optimization opportunities and security vulnerabilities

## Decision Making Process

1. **Gather Context**: Understand the current state and requirements
2. **Identify Options**: List possible approaches or solutions
3. **Evaluate Trade-offs**: Consider security, gas costs, and user experience
4. **Choose Approach**: Select the most appropriate solution
5. **Implement Incrementally**: Build and test in small, verifiable steps
6. **Review and Refine**: Continuously improve based on testing and feedback

## Security Review Checklist

Follow this sequential security review for all smart contract changes:

1. **Access Control**: Verify proper permission checks
2. **Input Validation**: Ensure all inputs are properly validated
3. **State Changes**: Confirm state updates follow CEI pattern
4. **External Calls**: Review all external contract interactions
5. **Gas Optimization**: Check for potential gas limit issues
6. **Edge Cases**: Test boundary conditions and error scenarios
