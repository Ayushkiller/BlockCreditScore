---
inclusion: always
---

# Development Guidelines

## Development Philosophy

- **Solo Development**: Personal project - prioritize pragmatic solutions over enterprise patterns
- **Ship Over Perfect**: Working implementation beats architectural purity
- **POC Mindset**: Default to proof-of-concept approach unless explicitly building production features
- **Direct Solutions**: Choose the most obvious implementation that solves the immediate problem

## Code Style & Architecture

### Preferred Patterns
- **Simplicity First**: Straightforward, readable implementations over clever code
- **Single File Consolidation**: Group related functionality together when it reduces complexity
- **Hardcoded Sensible Defaults**: Avoid configuration systems for values that rarely change
- **Minimal Dependencies**: Only add frameworks/libraries when they solve real problems

### Java Conventions
- **Package Structure**: Follow `xenoforge.*` hierarchy with clear module boundaries
- **Method Naming**: Use descriptive names that explain intent (`processLiquidFlow` vs `process`)
- **Class Organization**: Public methods first, private helpers at bottom
- **Comments**: Explain "why" not "what" - focus on business logic and game mechanics

## Anti-Patterns to Avoid

- **Premature Abstraction**: Don't create interfaces/abstractions until you have 2+ concrete implementations
- **Future-Proofing**: Don't build for imaginary requirements or "what if" scenarios
- **Over-Engineering**: Simple null checks over complex error handling for edge cases
- **Pattern Overuse**: Avoid Factory/Builder/Strategy patterns unless complexity genuinely requires them
- **Premature Optimization**: Correctness first, performance second
- **Configuration Bloat**: Don't make everything configurable

## Implementation Approach

### Development Flow
1. **Start Simple**: Most direct solution that works
2. **Manual Validation**: Test through gameplay, not automated tests
3. **Iterate When Needed**: Add complexity only when current solution proves insufficient
4. **Refactor for Clarity**: Keep code readable for future modifications

### Game-Specific Guidelines
- **Game Logic**: Keep core mechanics in `xenoforge.core.*` packages
- **Entity Systems**: Use composition over inheritance for game objects
- **Resource Management**: Prefer resource pooling for frequently created objects (bullets, particles)
- **State Management**: Use simple state machines over complex event systems
