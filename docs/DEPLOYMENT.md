# Deployment Guide - CampusFeedback+ 2.0

## Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- MetaMask wallet with SHM tokens
- MongoDB instance
- Redis instance
- IPFS node

---

## 1. Environment Setup

### Clone Repository
```bash
git clone <repository-url>
cd MR-Feedback
```

### Install Dependencies
```bash
# Root dependencies (Hardhat)
npm install

# Backend dependencies
cd backend
npm install
cd ..

# Frontend dependencies
cd frontend
npm install
cd ..

# AI services dependencies
cd ai-services
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cd ..
```

---

## 2. Configure Environment Variables

### Root `.env`
```env
SHARDEUM_RPC_URL=https://api-unstable.shardeum.org
PRIVATE_KEY=your_private_key_here
```

### Backend `.env`
```env
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/campusfeedback
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY=https://ipfs.io/ipfs
AI_SERVICE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SHARDEUM_RPC=https://api-unstable.shardeum.org
NEXT_PUBLIC_CHAIN_ID=8080
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs
```

### AI Services `.env`
```env
FLASK_ENV=production
MODEL_PATH=./models
HUGGINGFACE_API_KEY=your_key_here
```

---

## 3. Smart Contract Deployment

### Compile Contracts
```bash
npx hardhat compile
```

### Deploy to Shardeum Unstablenet
```bash
npx hardhat run scripts/deploy.js --network shardeum
```

**Save the deployed contract addresses!**

### Update Environment Variables
Update frontend `.env.local` with deployed addresses:
```env
NEXT_PUBLIC_STUDENT_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_FEEDBACK_ADDRESS=0x...
NEXT_PUBLIC_POINT_ECONOMY_ADDRESS=0x...
NEXT_PUBLIC_RATING_ADDRESS=0x...
NEXT_PUBLIC_AI_MODERATION_ADDRESS=0x...
NEXT_PUBLIC_GAMIFICATION_ADDRESS=0x...
NEXT_PUBLIC_SOCIAL_NETWORK_ADDRESS=0x...
NEXT_PUBLIC_REPUTATION_ADDRESS=0x...
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0x...
```

---

## 4. Database Setup

### MongoDB
```bash
# Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use MongoDB Atlas (cloud)
```

### Redis
```bash
# Start Redis
docker run -d -p 6379:6379 --name redis redis:latest
```

---

## 5. IPFS Setup

### Local IPFS Node
```bash
# Install IPFS
# https://docs.ipfs.tech/install/

# Initialize and start
ipfs init
ipfs daemon
```

### Or use Pinata/Infura
Update IPFS URLs in environment variables

---

## 6. AI Services Deployment

### Start AI Service
```bash
cd ai-services
python api/app.py
```

**Service runs on port 5000**

### Or use Docker
```bash
docker build -t campusfeedback-ai ./ai-services
docker run -d -p 5000:5000 campusfeedback-ai
```

---

## 7. Backend Deployment

### Development
```bash
cd backend
npm run dev
```

### Production
```bash
cd backend
npm start
```

### Or use Docker
```bash
docker build -t campusfeedback-backend ./backend
docker run -d -p 3001:3001 campusfeedback-backend
```

---

## 8. Frontend Deployment

### Development
```bash
cd frontend
npm run dev
```

### Production Build
```bash
cd frontend
npm run build
npm start
```

### Deploy to Vercel
```bash
cd frontend
vercel deploy --prod
```

---

## 9. Docker Compose (All Services)

### Start All Services
```bash
docker-compose up -d
```

### Stop All Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

---

## 10. Verification

### Check Smart Contracts
```bash
# Verify on Shardeum Explorer
# https://explorer-unstable.shardeum.org
```

### Test Backend API
```bash
curl http://localhost:3001/health
```

### Test AI Service
```bash
curl http://localhost:5000/health
```

### Test Frontend
Open browser: `http://localhost:3000`

---

## 11. Post-Deployment Tasks

### Grant Roles
```javascript
// Using Hardhat console
const studentRegistry = await ethers.getContractAt('StudentRegistryContract', ADDRESS);
await studentRegistry.grantVerifierRole(VERIFIER_ADDRESS);

const pointEconomy = await ethers.getContractAt('PointEconomyContract', ADDRESS);
await pointEconomy.grantRewardManagerRole(FEEDBACK_CONTRACT_ADDRESS);
```

### Initialize Data
- Create admin accounts
- Set up initial verifiers
- Configure AI thresholds
- Test feedback submission flow

---

## 12. Monitoring

### Application Logs
```bash
# Backend logs
pm2 logs backend

# AI service logs
tail -f ai-services/logs/app.log

# Frontend logs (Vercel)
vercel logs
```

### Blockchain Monitoring
- Monitor contract events on Shardeum Explorer
- Track gas usage
- Monitor transaction success rates

### Database Monitoring
- MongoDB Atlas dashboard
- Redis monitoring tools

---

## 13. Backup & Recovery

### Database Backups
```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/campusfeedback" --out=./backup

# Restore
mongorestore --uri="mongodb://localhost:27017/campusfeedback" ./backup
```

### Smart Contract Upgrades
- Use proxy pattern for upgradeable contracts
- Test thoroughly on testnet first
- Coordinate with users for maintenance windows

---

## 14. Security Checklist

- [ ] All private keys secured
- [ ] Environment variables not committed
- [ ] HTTPS enabled for production
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Database access restricted
- [ ] Smart contracts audited
- [ ] AI service secured
- [ ] Backup strategy in place

---

## 15. Troubleshooting

### Common Issues

**Contract deployment fails:**
- Check SHM balance
- Verify RPC URL
- Increase gas limit

**Backend can't connect to MongoDB:**
- Check MongoDB is running
- Verify connection string
- Check firewall rules

**Frontend can't connect to backend:**
- Verify CORS settings
- Check API URL in environment
- Ensure backend is running

**AI service errors:**
- Check Python dependencies
- Verify model downloads
- Check available memory

---

## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Documentation: [docs-url]
- Community: [discord/telegram]

---

## License

MIT License - See LICENSE file for details
