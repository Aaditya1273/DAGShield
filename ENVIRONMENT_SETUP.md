# 🔐 DAGShield Environment Setup Guide

## 📋 Required APIs for DAGShield

### **🔗 Essential APIs (Required)**

| API Service | Purpose | Priority | Get API Key From |
|-------------|---------|----------|------------------|
| **WalletConnect/Reown** | Wallet connections | 🔴 Critical | [cloud.reown.com](https://cloud.reown.com) |
| **Alchemy/Infura** | Blockchain RPC | 🔴 Critical | [alchemy.com](https://alchemy.com) or [infura.io](https://infura.io) |
| **Etherscan** | Contract verification | 🟡 Important | [etherscan.io/apis](https://etherscan.io/apis) |

### **⚡ Optional APIs (Future Features)**

| API Service | Purpose | Priority | Get API Key From |
|-------------|---------|----------|------------------|
| **OpenAI** | AI threat detection | 🟢 Optional | [platform.openai.com](https://platform.openai.com) |
| **Pinata** | IPFS storage | 🟢 Optional | [pinata.cloud](https://pinata.cloud) |
| **CoinGecko** | Price data | 🟢 Optional | [coingecko.com/api](https://coingecko.com/api) |

## 🚀 Quick Setup

### **1. Copy Environment File**
```bash
cp .env.example .env.local
```

### **2. Get WalletConnect Project ID (Most Important)**
1. Go to [cloud.reown.com](https://cloud.reown.com)
2. Create a new project
3. Copy your Project ID
4. Add `http://localhost:3000` to allowlist
5. Update `.env.local`:
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
```

### **3. Get Blockchain RPC URLs**

#### **Option A: Alchemy (Recommended)**
1. Sign up at [alchemy.com](https://alchemy.com)
2. Create apps for: Ethereum, Polygon, Sepolia
3. Copy API keys and update:
```env
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
```

#### **Option B: Infura**
1. Sign up at [infura.io](https://infura.io)
2. Create project and get API key
3. Update:
```env
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_KEY
```

### **4. Get Explorer API Keys (For Contract Verification)**
```env
ETHERSCAN_API_KEY=your_etherscan_key
POLYGONSCAN_API_KEY=your_polygonscan_key
BSCSCAN_API_KEY=your_bscscan_key
```

## 🔒 Security Best Practices

### **⚠️ NEVER Commit These to Git:**
- `PRIVATE_KEY` - Your wallet private key
- Real API keys in `.env.local`

### **✅ Safe to Commit:**
- `.env.example` - Template with placeholder values
- `NEXT_PUBLIC_*` variables (they're public anyway)

### **🛡️ Production Security:**
```env
# Use environment-specific values
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🧪 Development vs Production

### **Development (.env.local)**
```env
# Use free tier APIs
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=demo_project_id
MAINNET_RPC_URL=https://eth.llamarpc.com  # Free public RPC
```

### **Production (.env.production)**
```env
# Use paid/reliable APIs
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=real_project_id
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/production_key
```

## 🔧 Testing Your Setup

### **1. Check WalletConnect**
- Visit your app
- Click "Connect Wallet"
- Should see wallet options (not 403 error)

### **2. Check RPC URLs**
```bash
# Test if RPC is working
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  YOUR_RPC_URL
```

### **3. Check Contract Deployment**
```bash
npm run deploy:sepolia  # Should work without errors
```

## 🆘 Troubleshooting

### **Common Issues:**

**❌ "403 Forbidden" from WalletConnect**
- Solution: Get real project ID from cloud.reown.com
- Add your domain to allowlist

**❌ "Network Error" during transactions**
- Solution: Check RPC URLs are correct
- Try different RPC provider

**❌ "Contract verification failed"**
- Solution: Add explorer API keys
- Check network matches API key

**❌ "Insufficient funds" during deployment**
- Solution: Add testnet ETH to your wallet
- Use faucets for test networks

## 📚 Useful Links

- [WalletConnect Cloud](https://cloud.reown.com)
- [Alchemy Dashboard](https://dashboard.alchemy.com)
- [Infura Dashboard](https://infura.io/dashboard)
- [Etherscan API Docs](https://docs.etherscan.io)
- [Sepolia Faucet](https://sepoliafaucet.com)
- [Polygon Faucet](https://faucet.polygon.technology)

---

💡 **Pro Tip**: Start with just WalletConnect Project ID for basic functionality, then add other APIs as needed!
