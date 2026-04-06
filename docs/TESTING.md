# Testing Guide - CampusFeedback+ 2.0

## Overview

This guide covers all testing procedures for the CampusFeedback+ 2.0 platform.

---

## 1. Smart Contract Tests

### Running Tests
```bash
# Run all contract tests
npx hardhat test

# Run specific test file
npx hardhat test test/contracts/StudentRegistry.test.js

# Run with coverage
npx hardhat coverage

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

### Test Coverage
- StudentRegistryContract: Registration, verification, fees
- FeedbackContract: Submission, voting, categories
- PointEconomyContract: Awarding, transfer, redemption
- RatingContract: Multi-dimensional ratings
- GamificationContract: Badges, achievements
- GovernanceContract: Proposals, voting

### Expected Results
- All tests should pass
- Coverage should be >80%
- Gas usage within acceptable limits

---

## 2. Backend API Tests

### Setup
```bash
cd backend
npm install --save-dev jest supertest
```

### Running Tests
```bash
# Run all API tests
npm test

# Run specific test suite
npm test -- auth.test.js

# Run with coverage
npm test -- --coverage
```

### Test Suites
- Authentication: Login, token verification
- Feedback API: Submit, retrieve, vote
- Rating API: Submit, retrieve
- User API: Profile, stats
- Moderation API: History, appeals

---

## 3. AI Service Tests

### Running Tests
```bash
cd ai-services
pytest tests/

# With coverage
pytest --cov=. tests/

# Specific test
pytest tests/test_text_analyzer.py
```

### Test Coverage
- Text analysis accuracy
- Privacy scrubbing effectiveness
- Decision engine logic
- Image verification
- Performance benchmarks

---

## 4. Frontend Tests

### Setup
```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

### Running Tests
```bash
# Run component tests
npm test

# Run with coverage
npm test -- --coverage

# Run E2E tests (if configured)
npm run test:e2e
```

### Test Coverage
- Component rendering
- User interactions
- Form validation
- Web3 integration
- API calls

---

## 5. Integration Tests

### End-to-End Flow Tests

#### Test 1: Student Registration
```
1. Connect wallet
2. Register student (pay 60 SHM)
3. Wait for verification
4. Check verified status
```

#### Test 2: Feedback Submission
```
1. Login as verified student
2. Submit feedback
3. AI moderation processes
4. Feedback appears on blockchain
5. Points awarded
6. Feedback visible in UI
```

#### Test 3: Rating Submission
```
1. Login as verified student
2. Submit faculty rating
3. Rating recorded on blockchain
4. Average rating updated
5. Points awarded
```

#### Test 4: Gamification
```
1. Complete activities
2. Earn points
3. Unlock badges
4. Appear on leaderboard
```

---

## 6. Performance Tests

### Load Testing
```bash
# Using Artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

### Metrics to Monitor
- API response times
- Blockchain transaction times
- AI processing times
- Database query performance
- Frontend load times

### Acceptable Thresholds
- API: <500ms average
- Blockchain: <30s confirmation
- AI: <5s processing
- Database: <100ms queries
- Frontend: <3s initial load

---

## 7. Security Tests

### Smart Contract Auditing
```bash
# Slither static analysis
slither contracts/

# Mythril security analysis
myth analyze contracts/core/FeedbackContract.sol
```

### Backend Security
- SQL injection tests
- XSS vulnerability tests
- CSRF protection tests
- Authentication bypass tests
- Rate limiting tests

### Checklist
- [ ] No private keys in code
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF tokens implemented
- [ ] Rate limiting active
- [ ] HTTPS enforced
- [ ] Secure headers configured

---

## 8. Manual Testing Checklist

### User Flows

#### New User Registration
- [ ] Connect MetaMask
- [ ] Switch to Shardeum network
- [ ] Register with 60 SHM fee
- [ ] Receive pending status
- [ ] Get verified by admin
- [ ] Access full features

#### Feedback Submission
- [ ] Navigate to submit page
- [ ] Select category
- [ ] Enter feedback text
- [ ] Toggle anonymous option
- [ ] Submit successfully
- [ ] Receive AI moderation result
- [ ] See points awarded
- [ ] View feedback in list

#### Rating Faculty
- [ ] Navigate to rating page
- [ ] Enter faculty address
- [ ] Rate on 5 dimensions
- [ ] Add optional comment
- [ ] Submit rating
- [ ] See confirmation
- [ ] View updated average

#### Gamification
- [ ] View dashboard
- [ ] See point balance
- [ ] Check earned badges
- [ ] View leaderboard position
- [ ] Track progress to next badge

#### Governance
- [ ] View proposals
- [ ] Create new proposal
- [ ] Vote on active proposal
- [ ] See voting results
- [ ] Track proposal status

---

## 9. Browser Compatibility

### Supported Browsers
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Testing
- iOS Safari
- Android Chrome
- Responsive design verification

---

## 10. Test Data

### Sample Accounts
```javascript
// Admin
Address: 0x...
Role: Admin, Verifier

// Student 1
Address: 0x...
Status: Verified
Points: 1000

// Student 2
Address: 0x...
Status: Pending
```

### Sample Feedback
```javascript
{
  category: "Infrastructure",
  content: "The library needs more study spaces...",
  isAnonymous: false,
  aiQualityScore: 85
}
```

---

## 11. Continuous Integration

### GitHub Actions Workflow
```yaml
name: CI/CD

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run contract tests
        run: npx hardhat test
      - name: Run backend tests
        run: cd backend && npm test
      - name: Run AI tests
        run: cd ai-services && pytest
```

---

## 12. Test Reporting

### Generate Reports
```bash
# Contract coverage report
npx hardhat coverage

# Backend coverage report
cd backend && npm test -- --coverage

# AI service coverage
cd ai-services && pytest --cov-report=html
```

### View Reports
- Contracts: `coverage/index.html`
- Backend: `backend/coverage/lcov-report/index.html`
- AI: `ai-services/htmlcov/index.html`

---

## 13. Known Issues

### Current Limitations
- AI processing may timeout on very long texts (>5000 chars)
- Blockchain confirmations can be slow during network congestion
- IPFS retrieval may be slow for first-time access

### Workarounds
- Implement text length limits
- Show pending state during confirmation
- Cache IPFS content in database

---

## 14. Test Maintenance

### Regular Updates
- Update test data monthly
- Review and update test cases
- Monitor test execution times
- Fix flaky tests immediately
- Keep dependencies updated

---

## Success Criteria

All tests must pass before deployment:
- ✅ 100% contract tests passing
- ✅ >80% code coverage
- ✅ All integration tests passing
- ✅ Performance within thresholds
- ✅ Security audit passed
- ✅ Manual testing checklist complete

---

## Support

For testing issues:
- Review test logs
- Check environment setup
- Verify test data
- Consult documentation
- Open GitHub issue if needed
