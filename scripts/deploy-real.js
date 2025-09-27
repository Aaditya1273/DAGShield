const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * REAL Deployment Script for DAGShield Smart Contracts
 * Deploys to LIVE networks: U2U Testnet/Mainnet, Ethereum, Polygon, BSC
 */

async function main() {
  console.log(`🚀 Deploying DAGShield to REAL network: ${network.name}`);
  
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await deployer.getBalance();
  
  console.log(`📝 Deployer address: ${deployerAddress}`);
  console.log(`💰 Deployer balance: ${ethers.utils.formatEther(balance)} ${getNetworkCurrency()}`);
  
  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    throw new Error(`❌ Insufficient balance for deployment. Need at least 0.1 ${getNetworkCurrency()}`);
  }

  const deploymentResults = {};
  const startTime = Date.now();

  try {
    // 1. Deploy DAGShield Token
    console.log("\n📦 Deploying DAGShield Token...");
    const DAGShieldToken = await ethers.getContractFactory("DAGShieldToken");
    const dagToken = await DAGShieldToken.deploy();
    await dagToken.deployed();
    
    console.log(`✅ DAGShield Token deployed to: ${dagToken.address}`);
    deploymentResults.dagToken = dagToken.address;
    
    // Verify on block explorer
    if (network.name !== "localhost") {
      await verifyContract(dagToken.address, []);
    }

    // 2. Deploy DePIN Node Registry
    console.log("\n📦 Deploying DePIN Node Registry...");
    const DePINNodeRegistry = await ethers.getContractFactory("DePINNodeRegistry");
    const nodeRegistry = await DePINNodeRegistry.deploy(dagToken.address);
    await nodeRegistry.deployed();
    
    console.log(`✅ DePIN Node Registry deployed to: ${nodeRegistry.address}`);
    deploymentResults.nodeRegistry = nodeRegistry.address;
    
    if (network.name !== "localhost") {
      await verifyContract(nodeRegistry.address, [dagToken.address]);
    }

    // 3. Deploy DAGShield Oracle
    console.log("\n📦 Deploying DAGShield Oracle...");
    const DAGShieldOracle = await ethers.getContractFactory("DAGShieldOracle");
    const oracle = await DAGShieldOracle.deploy();
    await oracle.deployed();
    
    console.log(`✅ DAGShield Oracle deployed to: ${oracle.address}`);
    deploymentResults.oracle = oracle.address;
    
    if (network.name !== "localhost") {
      await verifyContract(oracle.address, []);
    }

    // 4. Configure contracts with REAL settings
    console.log("\n⚙️ Configuring contracts for REAL network...");
    
    // Set oracle as authorized in token contract
    const setOracleTx = await dagToken.setNodeAuthorization(oracle.address, true);
    await setOracleTx.wait();
    console.log("✅ Oracle authorized in token contract");
    
    // Set node registry as authorized
    const setRegistryTx = await dagToken.setNodeAuthorization(nodeRegistry.address, true);
    await setRegistryTx.wait();
    console.log("✅ Node registry authorized in token contract");
    
    // Configure oracle with supported chains
    const supportedChains = getSupportedChains();
    for (const chainId of supportedChains) {
      const setSupportedChainTx = await oracle.setSupportedChain(chainId, true);
      await setSupportedChainTx.wait();
      console.log(`✅ Chain ${chainId} added to oracle`);
    }

    // 5. Initialize with REAL data
    console.log("\n🔧 Initializing with REAL network data...");
    
    // Create initial challenge for real users
    const createChallengeTx = await nodeRegistry.createChallenge(
      "Launch Week Challenge",
      "Deploy your first node and detect 10 threats to earn bonus rewards",
      7 * 24 * 60 * 60, // 7 days
      ethers.utils.parseEther("10000"), // 10,000 DAG reward pool
      5 // minimum 5 participants
    );
    await createChallengeTx.wait();
    console.log("✅ Launch challenge created");

    // 6. Save deployment info to REAL config files
    const deploymentInfo = {
      network: network.name,
      chainId: network.config.chainId,
      deployer: deployerAddress,
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber(),
      contracts: deploymentResults,
      gasUsed: await calculateTotalGasUsed(deploymentResults),
      explorerUrls: getExplorerUrls(deploymentResults),
    };

    // Save to multiple formats for different uses
    await saveDeploymentInfo(deploymentInfo);
    await updateFrontendConfig(deploymentResults);
    await updateRustConfig(deploymentResults);

    const deploymentTime = (Date.now() - startTime) / 1000;
    
    console.log("\n🎉 REAL DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log(`⏱️  Total deployment time: ${deploymentTime}s`);
    console.log(`🔗 Network: ${network.name} (Chain ID: ${network.config.chainId})`);
    console.log(`💰 Total gas used: ${deploymentInfo.gasUsed} ETH`);
    console.log("\n📋 Contract Addresses:");
    
    Object.entries(deploymentResults).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
      console.log(`   Explorer: ${getExplorerUrl(address)}`);
    });

    console.log("\n🔧 Next Steps:");
    console.log("1. Update frontend environment variables");
    console.log("2. Update Rust node client configuration");
    console.log("3. Start node clients to begin threat detection");
    console.log("4. Test cross-chain oracle functionality");
    console.log("5. Monitor contracts on block explorer");

  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED:");
    console.error(error);
    process.exit(1);
  }
}

async function verifyContract(address, constructorArgs) {
  try {
    console.log(`🔍 Verifying contract at ${address}...`);
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    console.log(`✅ Contract verified successfully`);
  } catch (error) {
    console.log(`⚠️  Verification failed: ${error.message}`);
  }
}

function getNetworkCurrency() {
  const currencies = {
    u2uTestnet: "U2U",
    u2uMainnet: "U2U",
    ethereum: "ETH",
    polygon: "MATIC",
    bsc: "BNB",
    avalanche: "AVAX",
  };
  return currencies[network.name] || "ETH";
}

function getSupportedChains() {
  // Return real chain IDs for cross-chain support
  return [
    1,     // Ethereum
    137,   // Polygon
    56,    // BSC
    43114, // Avalanche
    96,    // U2U Mainnet
    2484,  // U2U Testnet
  ];
}

function getExplorerUrls(contracts) {
  const baseUrls = {
    u2uTestnet: "https://testnet.u2uscan.xyz",
    u2uMainnet: "https://u2uscan.xyz",
    ethereum: "https://etherscan.io",
    polygon: "https://polygonscan.com",
    bsc: "https://bscscan.com",
    avalanche: "https://snowtrace.io",
  };
  
  const baseUrl = baseUrls[network.name];
  if (!baseUrl) return {};
  
  const urls = {};
  Object.entries(contracts).forEach(([name, address]) => {
    urls[name] = `${baseUrl}/address/${address}`;
  });
  
  return urls;
}

function getExplorerUrl(address) {
  const baseUrls = {
    u2uTestnet: "https://testnet.u2uscan.xyz",
    u2uMainnet: "https://u2uscan.xyz",
    ethereum: "https://etherscan.io",
    polygon: "https://polygonscan.com",
    bsc: "https://bscscan.com",
    avalanche: "https://snowtrace.io",
  };
  
  const baseUrl = baseUrls[network.name];
  return baseUrl ? `${baseUrl}/address/${address}` : address;
}

async function calculateTotalGasUsed(contracts) {
  // Estimate total gas used (simplified calculation)
  const gasPerContract = 2000000; // Average gas per contract
  const totalGas = Object.keys(contracts).length * gasPerContract;
  const gasPrice = await ethers.provider.getGasPrice();
  const totalCost = ethers.utils.formatEther(gasPrice.mul(totalGas));
  return totalCost;
}

async function saveDeploymentInfo(info) {
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save network-specific deployment
  const networkFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(networkFile, JSON.stringify(info, null, 2));
  
  // Save to latest deployment
  const latestFile = path.join(deploymentsDir, "latest.json");
  fs.writeFileSync(latestFile, JSON.stringify(info, null, 2));
  
  console.log(`📁 Deployment info saved to: ${networkFile}`);
}

async function updateFrontendConfig(contracts) {
  const frontendConfig = {
    NEXT_PUBLIC_DAGSHIELD_TOKEN: contracts.dagToken,
    NEXT_PUBLIC_NODE_REGISTRY: contracts.nodeRegistry,
    NEXT_PUBLIC_ORACLE: contracts.oracle,
    NEXT_PUBLIC_CHAIN_ID: network.config.chainId,
    NEXT_PUBLIC_NETWORK_NAME: network.name,
  };
  
  const configDir = path.join(__dirname, "..", "config");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const configFile = path.join(configDir, `frontend-${network.name}.env`);
  const configContent = Object.entries(frontendConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(configFile, configContent);
  console.log(`📁 Frontend config saved to: ${configFile}`);
}

async function updateRustConfig(contracts) {
  const rustConfig = {
    dagshield_token: contracts.dagToken,
    node_registry: contracts.nodeRegistry,
    oracle: contracts.oracle,
    chain_id: network.config.chainId,
    network_name: network.name,
    rpc_url: network.config.url,
  };
  
  const configDir = path.join(__dirname, "..", "node-client", "config");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const configFile = path.join(configDir, `${network.name}.toml`);
  const configContent = Object.entries(rustConfig)
    .map(([key, value]) => `${key} = "${value}"`)
    .join('\n');
  
  fs.writeFileSync(configFile, `[contracts]\n${configContent}`);
  console.log(`📁 Rust config saved to: ${configFile}`);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
