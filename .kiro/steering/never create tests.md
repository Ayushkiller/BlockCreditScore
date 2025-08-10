---
inclusion: always
---

# Testing Guidelines

## No Formal Test Suites

**Do not create formal unit tests, test suites, or comprehensive test coverage** for this project. This is a solo development, proof-of-concept focused codebase where shipping working features takes priority over testing infrastructure.

## Avoid These Testing Patterns

- **Unit Test Files**: No `*.test.js`, `*.spec.ts`, or similar test files
- **Testing Frameworks**: No Jest, Mocha, Vitest test suites (beyond existing config)
- **Test Coverage Requirements**: No coverage metrics or coverage-driven development
- **Mocking/Stubbing**: No complex mock setups or dependency injection for testing
- **TDD Approach**: No test-first development methodology

## Quality Assurance Alternatives

### Manual Validation
- **Dashboard Testing**: Use the frontend dashboard to verify functionality
- **Real System Integration**: Test through actual blockchain interactions
- **Live Data Verification**: Validate with real market data and transactions

### Validation Through Usage
- **Smart Contract Deployment**: Test contracts on testnets before mainnet
- **API Endpoint Testing**: Verify through frontend integration
- **Data Pipeline Validation**: Monitor real-time data flows through dashboard

## Development Flow

1. **Build Feature**: Implement functionality directly
2. **Manual Test**: Verify through dashboard or direct interaction  
3. **Deploy & Monitor**: Use monitoring tools to catch issues
4. **Iterate**: Fix problems as they're discovered in usage

## Rationale

This approach aligns with the project's **"ship over perfect"** philosophy, prioritizing:
- Rapid feature development
- Real-world validation over theoretical testing
- Minimal development overhead
- Focus on working implementations