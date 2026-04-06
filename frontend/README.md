# CampusFeedback+ 2.0 Frontend

Next.js frontend application for the CampusFeedback+ 2.0 platform.

## Features

- 🔐 Web3 wallet authentication (MetaMask)
- 🤖 AI-moderated feedback submission
- ⭐ Multi-dimensional rating system
- 🎮 Gamification with points and badges
- 👥 Social features (profiles, communities)
- 📊 Analytics dashboard
- 🏛️ DAO governance participation

## Tech Stack

- **Framework**: Next.js 14
- **Language**: JavaScript
- **Web3**: ethers.js v6
- **State**: Zustand
- **Styling**: Tailwind CSS
- **UI**: Framer Motion, React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask wallet
- Shardeum Unstablenet access

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SHARDEUM_RPC=https://api-unstable.shardeum.org
NEXT_PUBLIC_CHAIN_ID=8080
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs

# Contract Addresses (after deployment)
NEXT_PUBLIC_STUDENT_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_FEEDBACK_ADDRESS=0x...
NEXT_PUBLIC_POINT_ECONOMY_ADDRESS=0x...
NEXT_PUBLIC_RATING_ADDRESS=0x...
```

## Project Structure

```
frontend/
├── pages/              # Next.js pages
│   ├── index.js       # Landing page
│   ├── dashboard.js   # User dashboard
│   ├── feedback/      # Feedback pages
│   └── rating/        # Rating pages
├── components/        # Reusable components
├── contexts/          # React contexts
│   └── Web3Context.js # Web3 provider
├── utils/             # Utility functions
│   └── api.js         # API client
└── styles/            # Global styles
```

## Key Pages

- `/` - Landing page with wallet connection
- `/dashboard` - User dashboard with stats
- `/feedback/submit` - Submit feedback
- `/rating/submit` - Submit ratings
- `/gamification` - Badges and leaderboard
- `/governance` - DAO proposals

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Deployment

The frontend can be deployed to Vercel, Netlify, or any Node.js hosting platform.

```bash
# Build
npm run build

# The output will be in .next/ directory
```

## License

MIT
