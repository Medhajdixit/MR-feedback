# Backend Service - CampusFeedback+ 2.0

Node.js/Express backend API for the CampusFeedback+ platform.

## Features

- 🔐 JWT Authentication with wallet signatures
- 📝 Feedback submission and retrieval
- ⭐ Rating system
- 🤖 AI moderation integration
- 🔗 Blockchain service layer
- 💾 MongoDB database
- ⚡ Redis caching
- 📦 IPFS integration

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB
- **Cache**: Redis
- **Blockchain**: Ethers.js v6
- **Authentication**: JWT + Wallet Signatures
- **Storage**: IPFS

## Project Structure

```
backend/
├── api/
│   ├── app.js              # Express app configuration
│   └── routes/             # API routes
│       ├── auth.js         # Authentication
│       ├── feedback.js     # Feedback management
│       ├── rating.js       # Rating system
│       ├── user.js         # User profiles
│       ├── moderation.js   # Moderation
│       └── governance.js   # DAO governance
├── models/
│   └── index.js            # Mongoose models
├── services/
│   ├── blockchainService.js # Smart contract interaction
│   ├── aiService.js        # AI moderation client
│   └── ipfsService.js      # IPFS integration
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── errorHandler.js     # Error handling
├── server.js               # Server entry point
└── package.json            # Dependencies
```

## Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/campusfeedback
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_here
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY=https://ipfs.io/ipfs
AI_SERVICE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
SHARDEUM_RPC_URL=https://api-unstable.shardeum.org
PRIVATE_KEY=your_private_key_here
```

## API Endpoints

### Authentication
- `POST /api/auth/nonce` - Get nonce for signing
- `POST /api/auth/login` - Login with signature
- `GET /api/auth/verify` - Verify token

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get all feedbacks
- `GET /api/feedback/:id` - Get specific feedback
- `POST /api/feedback/:id/vote` - Vote on feedback

### Rating
- `POST /api/rating` - Submit rating
- `GET /api/rating/faculty/:address` - Get faculty ratings

### User
- `GET /api/user/:address` - Get user profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/:address/stats` - Get user stats
- `GET /api/user/:address/points` - Get point balance

### Moderation
- `GET /api/moderation/history` - Get moderation history
- `POST /api/moderation/appeal` - Submit appeal

### Governance
- `GET /api/governance/proposals` - Get proposals
- `POST /api/governance/proposals` - Create proposal
- `POST /api/governance/proposals/:id/vote` - Vote on proposal

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run tests
npm test

# Check code style
npm run lint
```

## Deployment

See [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) for deployment instructions.

## License

MIT
