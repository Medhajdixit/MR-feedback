# Test Directory

This directory contains all test files for CampusFeedback+ 2.0.

## Structure

```
test/
├── contracts/          # Smart contract tests
│   ├── CoreContracts.test.js
│   └── FeatureContracts.test.js
├── ai-services/       # AI service tests
│   └── moderationService.test.py
└── integration/       # End-to-end integration tests
    └── endToEnd.test.js
```

## Running Tests

### Smart Contract Tests
```bash
npm test
npm run test:coverage
```

### AI Service Tests
```bash
cd ai-services
pytest
pytest --cov
```

### Integration Tests
```bash
npm run test:integration
```

## Test Coverage Goals

- Smart Contracts: >95%
- Backend API: >90%
- AI Services: >90%
- Integration: All critical paths

## Phase 7 Implementation

Comprehensive tests will be implemented in Phase 7 of the project.
