# CampusFeedback+ 2.0

> AI-Moderated Campus Feedback System on Shardeum Blockchain

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)

## 🌟 Overview

CampusFeedback+ 2.0 is a revolutionary blockchain-based feedback system that combines AI-powered content moderation with transparent, immutable record-keeping on the Shardeum network. The platform enables students to provide constructive feedback on faculty, infrastructure, and campus services while earning rewards through a comprehensive gamification system.

### Key Features

- 🤖 **AI-Powered Moderation**: Advanced NLP for toxicity detection, sentiment analysis, and quality scoring
- 🔗 **Blockchain Transparency**: Immutable feedback records on Shardeum
- 🎮 **Gamification**: Points, badges, achievements, and leaderboards
- 🔒 **Privacy-First**: Zero-knowledge proofs and PII scrubbing
- ⭐ **Multi-Dimensional Ratings**: Comprehensive faculty and infrastructure evaluation
- 🏛️ **DAO Governance**: Community-driven platform decisions
- 👥 **Social Features**: Profiles, communities, and networking

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Smart Contracts](#smart-contracts)
- [AI Services](#ai-services)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │ Feedback │  │  Rating  │  │Governance│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                    Backend (Node.js/Express)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │   API    │  │Blockchain│  │   IPFS   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────┬───────────────┬──────────────────┬────────────────┘
         │               │                  │
    ┌────┴────┐    ┌────┴────┐      ┌─────┴─────┐
    │MongoDB  │    │  Redis  │      │AI Service │
    │         │    │         │      │(Python)   │
    └─────────┘    └─────────┘      └───────────┘
                                           │
                                    ┌──────┴──────┐
                                    │   Models    │
                                    │ BERT, spaCy │
                                    └─────────────┘
         │
    ┌────┴────────────────────────────────────┐
    │    Shardeum Blockchain (Smart Contracts)│
    │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
    │  │Student│ │Feedback│ │Points│ │Rating│  │
    │  └──────┘ └──────┘ └──────┘ └──────┘  │
    └─────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Blockchain
- **Solidity 0.8.20**: Smart contract development
- **Hardhat**: Development environment
- **Ethers.js v6**: Blockchain interaction
- **OpenZeppelin**: Security libraries
- **Shardeum**: Layer 1 blockchain

### Backend
- **Node.js 18+**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database
- **Redis**: Caching
- **IPFS**: Decentralized storage
- **JWT**: Authentication

### AI Services
- **Python 3.11**: Runtime
- **Flask**: API framework
- **Transformers**: BERT models
- **spaCy**: NLP processing
- **PyTorch**: ML framework

### Frontend
- **Next.js 14**: React framework
- **React 18**: UI library
- **Tailwind CSS**: Styling
- **Ethers.js**: Web3 integration
- **Zustand**: State management

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- MetaMask wallet
- Git
```

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/campusfeedback-2.0.git
cd campusfeedback-2.0

# Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd ai-services && pip install -r requirements.txt && cd ..

# Download AI models
cd ai-services
python -m spacy download en_core_web_sm
cd ..

# Configure environment
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp ai-services/.env.example ai-services/.env

# Edit .env files with your configuration
```

### Running with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Running Manually

```bash
# Terminal 1: Smart Contracts (Hardhat node)
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: AI Services
cd ai-services
python api/app.py

# Terminal 4: Backend
cd backend
npm run dev

# Terminal 5: Frontend
cd frontend
npm run dev
```

**Access the application**: http://localhost:3000

---

## 📁 Project Structure

```
MR-Feedback/
├── contracts/              # Smart contracts
│   ├── core/              # Core contracts
│   ├── features/          # Advanced features
│   └── privacy/           # Privacy contracts
├── ai-services/           # AI moderation
│   ├── moderation/        # Text analysis
│   ├── privacy/           # PII scrubbing
│   ├── analytics/         # Trend analysis
│   └── api/               # Flask API
├── backend/               # Node.js backend
│   ├── api/               # Express routes
│   ├── models/            # Database models
│   ├── services/          # Business logic
│   └── middleware/        # Auth & validation
├── frontend/              # Next.js frontend
│   ├── pages/             # Route pages
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   └── utils/             # Utilities
├── test/                  # Test suites
│   └── contracts/         # Contract tests
├── scripts/               # Deployment scripts
└── docs/                  # Documentation
```

---

## 📜 Smart Contracts

### Core Contracts

| Contract | Purpose | Key Features |
|----------|---------|--------------|
| **StudentRegistryContract** | Student management | Registration (60 SHM), verification, roles |
| **FeedbackContract** | Feedback system | Submission, voting, categories |
| **PointEconomyContract** | Reward system | Points, redemption (1000 pts = 1 SHM) |
| **RatingContract** | Rating system | Multi-dimensional ratings (1-10) |
| **AIModerationContract** | Moderation | AI decisions, appeals |
| **PrivacyContract** | Privacy | ZK proofs, anonymization |

### Advanced Contracts

| Contract | Purpose | Key Features |
|----------|---------|--------------|
| **GamificationContract** | Achievements | 8 badges, 5 tiers, leaderboard |
| **SocialNetworkContract** | Social features | Follow, communities, profiles |
| **ReputationContract** | Trust system | Multi-factor scoring, 5 levels |
| **GovernanceContract** | DAO | Proposals, voting, execution |

**Total Contracts**: 10  
**Solidity Version**: 0.8.20  
**Test Coverage**: 92%+

---

## 🤖 AI Services

### Text Analysis
- **Toxicity Detection**: unitary/toxic-bert
- **Sentiment Analysis**: DistilBERT
- **Constructiveness Scoring**: Rule-based + ML
- **Spam Detection**: Pattern matching

### Privacy Protection
- **PII Scrubbing**: NER-based removal
- **Pattern Anonymization**: Writing style normalization
- **Metadata Sanitization**: EXIF stripping

### Decision Engine
- **Auto-Moderation**: Threshold-based decisions
- **Quality Bonus**: 0-30 points
- **Enhancement Suggestions**: Improvement tips

### API Endpoints
- `POST /api/moderate` - Moderate content
- `POST /api/scrub-privacy` - Remove PII
- `POST /api/verify-image` - Verify image authenticity
- `POST /api/enhance-feedback` - Get suggestions

---

## 📚 API Documentation

### Authentication

```bash
# Get nonce
POST /api/auth/nonce
Body: { "address": "0x..." }

# Login with signature
POST /api/auth/login
Body: {
  "address": "0x...",
  "signature": "0x...",
  "message": "..."
}
```

### Feedback

```bash
# Submit feedback
POST /api/feedback
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "content": "...",
  "category": "Infrastructure",
  "isAnonymous": false
}

# Get all feedbacks
GET /api/feedback?category=Infrastructure&status=approved
```

### Rating

```bash
# Submit rating
POST /api/rating
Body: {
  "facultyAddress": "0x...",
  "dimensions": [8, 9, 7, 8, 9],
  "comment": "...",
  "isAnonymous": false
}
```

**Full API documentation**: See [docs/API.md](docs/API.md)

---

## 🚢 Deployment

### Shardeum Unstablenet

```bash
# Compile contracts
npx hardhat compile

# Deploy to Shardeum
npx hardhat run scripts/deploy.js --network shardeum

# Verify contracts
npx hardhat verify --network shardeum <CONTRACT_ADDRESS>
```

### Production Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete guide.

---

## 🧪 Testing

```bash
# Smart contract tests
npx hardhat test
npx hardhat coverage

# Backend tests
cd backend && npm test

# AI service tests
cd ai-services && pytest

# Frontend tests
cd frontend && npm test
```

**Test Coverage**: 92%+ across all contracts

See [docs/TESTING.md](docs/TESTING.md) for detailed testing guide.

---

## 🎯 Key Metrics

- **10 Smart Contracts**: Core + Advanced features
- **6 AI Models**: NLP and ML models
- **20+ API Endpoints**: RESTful backend
- **30+ React Components**: Modern UI
- **32+ Test Cases**: Comprehensive coverage
- **92%+ Test Coverage**: High quality assurance

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Project Lead**: [Your Name]
- **Smart Contract Development**: [Team Member]
- **AI/ML Engineering**: [Team Member]
- **Full Stack Development**: [Team Member]

---

## 🙏 Acknowledgments

- **Shardeum**: For the scalable blockchain platform
- **OpenZeppelin**: For secure smart contract libraries
- **Hugging Face**: For pre-trained AI models
- **Next.js Team**: For the amazing React framework

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/campusfeedback-2.0/issues)
- **Discord**: [Join our community](https://discord.gg/...)
- **Email**: support@campusfeedback.com

---

## 🗺️ Roadmap

- [x] Phase 1: Foundation & Infrastructure
- [x] Phase 2: Core Smart Contracts
- [x] Phase 3: AI Moderation System
- [x] Phase 4: Advanced Features
- [x] Phase 5: Backend Services
- [x] Phase 6: Frontend Application
- [x] Phase 7: Integration & Testing
- [x] Phase 8: Deployment & Documentation
- [ ] Phase 9: Mainnet Launch
- [ ] Phase 10: Mobile App Development

---

<div align="center">

**Made with ❤️ for better campus feedback**

[Website](https://campusfeedback.com) • [Documentation](docs/) • [Demo](https://demo.campusfeedback.com)

</div>
