# Quick Start Guide - CampusFeedback+ 2.0

Get up and running in 5 minutes!

---

## 🎯 Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18+ installed
- ✅ Python 3.11+ installed
- ✅ MetaMask wallet extension
- ✅ Git installed
- ✅ 100+ SHM tokens (for testing)

---

## ⚡ 5-Minute Setup

### Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/campusfeedback-2.0.git
cd campusfeedback-2.0

# Install all dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd ai-services && pip install -r requirements.txt && cd ..
```

### Step 2: Configure Environment (1 minute)

```bash
# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit .env files with your settings
# Minimum required: PRIVATE_KEY in root .env
```

### Step 3: Start Services (2 minutes)

```bash
# Option A: Using Docker Compose (Recommended)
docker-compose up -d

# Option B: Manual startup
# Terminal 1: Blockchain
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: AI Services
cd ai-services && python api/app.py

# Terminal 4: Backend
cd backend && npm run dev

# Terminal 5: Frontend
cd frontend && npm run dev
```

### Step 4: Access Application

Open your browser: **http://localhost:3000**

---

## 🎮 First Steps

### 1. Connect Wallet
- Click "Connect Wallet"
- Approve MetaMask connection
- Switch to Shardeum network (auto-prompted)

### 2. Register as Student
- Pay 60 SHM verification fee
- Wait for admin verification
- Access full platform features

### 3. Submit Feedback
- Navigate to "Submit Feedback"
- Choose category
- Write constructive feedback
- Get AI quality score
- Earn points!

### 4. Explore Features
- View dashboard
- Check leaderboard
- Earn badges
- Rate faculty
- Participate in governance

---

## 🔧 Configuration

### Minimum .env Setup

**Root `.env`:**
```env
PRIVATE_KEY=your_private_key_here
SHARDEUM_RPC_URL=https://api-unstable.shardeum.org
```

**Backend `.env`:**
```env
MONGODB_URI=mongodb://localhost:27017/campusfeedback
JWT_SECRET=your_secret_here
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SHARDEUM_RPC=https://api-unstable.shardeum.org
```

---

## 🐛 Troubleshooting

### "Contract deployment failed"
- Check SHM balance
- Verify RPC URL
- Ensure private key is correct

### "AI service not responding"
- Check Python dependencies installed
- Verify port 5000 is free
- Download spaCy model: `python -m spacy download en_core_web_sm`

### "Frontend can't connect to backend"
- Ensure backend is running on port 3001
- Check CORS settings
- Verify API_URL in frontend .env

### "MetaMask not connecting"
- Ensure MetaMask is installed
- Check network is Shardeum
- Try refreshing the page

---

## 📚 Next Steps

1. **Read Documentation**: [docs/](../docs/)
2. **Run Tests**: `npx hardhat test`
3. **Deploy to Testnet**: See [DEPLOYMENT.md](DEPLOYMENT.md)
4. **Customize**: Modify contracts and UI
5. **Contribute**: See [CONTRIBUTING.md](../CONTRIBUTING.md)

---

## 🆘 Get Help

- **Documentation**: [docs/](../docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/campusfeedback-2.0/issues)
- **Discord**: [Community](https://discord.gg/...)

---

**Happy Building! 🚀**
