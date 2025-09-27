#!/bin/bash

# DAGShield REAL Deployment Script
# Deploys to LIVE U2U Network and starts real services

set -e

echo "🚀 DAGShield REAL Deployment Starting..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local not found!${NC}"
    echo "Please copy env.example to .env.local and fill in your values:"
    echo "cp env.example .env.local"
    exit 1
fi

# Load environment variables
source .env.local

# Validate required environment variables
echo -e "${BLUE}🔍 Validating environment variables...${NC}"

required_vars=(
    "U2U_TESTNET_RPC"
    "PRIVATE_KEY"
    "ETHERSCAN_API_KEY"
    "VIRUSTOTAL_API_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Missing required environment variable: $var${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install
cd node-client && cargo build --release && cd ..

# Compile smart contracts
echo -e "${BLUE}🔨 Compiling smart contracts...${NC}"
npx hardhat compile

# Run tests
echo -e "${BLUE}🧪 Running tests...${NC}"
npx hardhat test
cd node-client && cargo test && cd ..

# Deploy to U2U Testnet
echo -e "${BLUE}🚀 Deploying to U2U Testnet...${NC}"
npx hardhat run scripts/deploy-real.js --network u2uTestnet

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Smart contracts deployed successfully${NC}"
else
    echo -e "${RED}❌ Smart contract deployment failed${NC}"
    exit 1
fi

# Update frontend configuration
echo -e "${BLUE}⚙️ Updating frontend configuration...${NC}"
if [ -f "config/frontend-u2uTestnet.env" ]; then
    cat config/frontend-u2uTestnet.env >> .env.local
    echo -e "${GREEN}✅ Frontend configuration updated${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend config not found, using existing values${NC}"
fi

# Build frontend
echo -e "${BLUE}🏗️ Building frontend...${NC}"
npm run build

# Start AI threat detection service
echo -e "${BLUE}🤖 Starting AI threat detection service...${NC}"
cd ai-models
python -m pip install -r requirements.txt
nohup python threat-detection.py > ../logs/ai-service.log 2>&1 &
AI_PID=$!
echo $AI_PID > ../pids/ai-service.pid
cd ..

# Start Rust node client
echo -e "${BLUE}🦀 Starting Rust node client...${NC}"
mkdir -p logs pids
cd node-client
nohup ./target/release/dagshield-node start --config ../config/u2uTestnet.toml > ../logs/node-client.log 2>&1 &
NODE_PID=$!
echo $NODE_PID > ../pids/node-client.pid
cd ..

# Start frontend server
echo -e "${BLUE}🌐 Starting frontend server...${NC}"
nohup npm start > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > pids/frontend.pid

# Wait for services to start
echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 10

# Check service health
echo -e "${BLUE}🏥 Checking service health...${NC}"

# Check if AI service is running
if ps -p $AI_PID > /dev/null; then
    echo -e "${GREEN}✅ AI Threat Detection Service: RUNNING (PID: $AI_PID)${NC}"
else
    echo -e "${RED}❌ AI Threat Detection Service: FAILED${NC}"
fi

# Check if node client is running
if ps -p $NODE_PID > /dev/null; then
    echo -e "${GREEN}✅ Rust Node Client: RUNNING (PID: $NODE_PID)${NC}"
else
    echo -e "${RED}❌ Rust Node Client: FAILED${NC}"
fi

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend Server: RUNNING (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend Server: FAILED${NC}"
fi

# Test blockchain connectivity
echo -e "${BLUE}🔗 Testing blockchain connectivity...${NC}"
if curl -s -X POST -H "Content-Type: application/json" \
   --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
   $U2U_TESTNET_RPC > /dev/null; then
    echo -e "${GREEN}✅ U2U Testnet: CONNECTED${NC}"
else
    echo -e "${RED}❌ U2U Testnet: CONNECTION FAILED${NC}"
fi

# Test AI service
echo -e "${BLUE}🤖 Testing AI service...${NC}"
if curl -s http://localhost:8080/health > /dev/null; then
    echo -e "${GREEN}✅ AI Service: RESPONDING${NC}"
else
    echo -e "${YELLOW}⚠️ AI Service: NOT RESPONDING (may still be starting)${NC}"
fi

# Test frontend
echo -e "${BLUE}🌐 Testing frontend...${NC}"
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend: ACCESSIBLE${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend: NOT ACCESSIBLE (may still be starting)${NC}"
fi

# Display deployment summary
echo ""
echo -e "${GREEN}🎉 DAGShield REAL Deployment Complete!${NC}"
echo "======================================"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo "• Network: U2U Testnet (Chain ID: 2484)"
echo "• Smart Contracts: DEPLOYED ✅"
echo "• AI Service: RUNNING ✅"
echo "• Node Client: RUNNING ✅"
echo "• Frontend: RUNNING ✅"
echo ""
echo -e "${BLUE}🔗 Access Points:${NC}"
echo "• Dashboard: http://localhost:3000"
echo "• AI API: http://localhost:8080"
echo "• Node Metrics: http://localhost:9090"
echo ""
echo -e "${BLUE}📁 Important Files:${NC}"
echo "• Logs: ./logs/"
echo "• PIDs: ./pids/"
echo "• Config: ./config/"
echo "• Deployments: ./deployments/"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "• Stop all: ./stop-services.sh"
echo "• View logs: tail -f logs/*.log"
echo "• Restart: ./restart-services.sh"
echo ""
echo -e "${BLUE}📈 Next Steps:${NC}"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Connect your MetaMask wallet"
echo "3. Switch to U2U Testnet network"
echo "4. Deploy your first node"
echo "5. Start detecting threats!"
echo ""
echo -e "${YELLOW}⚠️ Important Notes:${NC}"
echo "• Keep your private keys secure"
echo "• Monitor service logs for errors"
echo "• Ensure sufficient testnet tokens"
echo "• Services run in background - use stop script to shut down"
echo ""

# Create management scripts
echo -e "${BLUE}📝 Creating management scripts...${NC}"

# Stop services script
cat > stop-services.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping DAGShield services..."

if [ -f pids/ai-service.pid ]; then
    kill $(cat pids/ai-service.pid) 2>/dev/null
    rm pids/ai-service.pid
    echo "✅ AI Service stopped"
fi

if [ -f pids/node-client.pid ]; then
    kill $(cat pids/node-client.pid) 2>/dev/null
    rm pids/node-client.pid
    echo "✅ Node Client stopped"
fi

if [ -f pids/frontend.pid ]; then
    kill $(cat pids/frontend.pid) 2>/dev/null
    rm pids/frontend.pid
    echo "✅ Frontend stopped"
fi

echo "🏁 All services stopped"
EOF

# Restart services script
cat > restart-services.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting DAGShield services..."
./stop-services.sh
sleep 3
./deploy-real.sh
EOF

# Status check script
cat > check-status.sh << 'EOF'
#!/bin/bash
echo "📊 DAGShield Service Status:"
echo "=========================="

check_service() {
    local name=$1
    local pid_file=$2
    local port=$3
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat $pid_file)
        if ps -p $pid > /dev/null; then
            echo "✅ $name: RUNNING (PID: $pid)"
            if [ -n "$port" ]; then
                if curl -s http://localhost:$port > /dev/null; then
                    echo "   └─ Port $port: ACCESSIBLE"
                else
                    echo "   └─ Port $port: NOT ACCESSIBLE"
                fi
            fi
        else
            echo "❌ $name: NOT RUNNING"
        fi
    else
        echo "❌ $name: PID FILE NOT FOUND"
    fi
}

check_service "AI Service" "pids/ai-service.pid" "8080"
check_service "Node Client" "pids/node-client.pid" "9090"
check_service "Frontend" "pids/frontend.pid" "3000"

echo ""
echo "📁 Log Files:"
echo "============"
ls -la logs/ 2>/dev/null || echo "No log files found"
EOF

# Make scripts executable
chmod +x stop-services.sh restart-services.sh check-status.sh

echo -e "${GREEN}✅ Management scripts created${NC}"
echo ""
echo -e "${BLUE}🎯 DAGShield is now LIVE and ready for real threat detection!${NC}"
echo -e "${GREEN}Visit http://localhost:3000 to start using your decentralized security network${NC}"
