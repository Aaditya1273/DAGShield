/**
 * REAL Blockchain Integration for DAGShield Frontend
 * Connects to live U2U Network and other blockchains
 */

import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  Signer,
  formatEther,
  parseEther,
  formatUnits,
  keccak256,
  toUtf8Bytes,
} from 'ethers';

// Contract ABIs (simplified - in production, import from artifacts)
const DAG_SHIELD_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function stake(uint256 amount)',
  'function unstake(uint256 amount)',
  'function getStakedAmount(address user) view returns (uint256)',
  'function claimRewards()',
  'function deployNode(uint256 stakeAmount, string memory region) returns (bytes32)',
  'event Staked(address indexed user, uint256 amount, uint256 timestamp)',
  'event Unstaked(address indexed user, uint256 amount, uint256 rewards)',
  'event NodeDeployed(bytes32 indexed nodeId, address indexed owner, uint256 stakedAmount)',
];

const NODE_REGISTRY_ABI = [
  'function registerNode(string nodeId, uint8 deviceType, uint8[] capabilities, string location, uint256 stakeAmount, tuple(uint32,uint32,uint32,uint32,uint32) hardwareSpecs)',
  'function updateNodeMetrics(string nodeId, uint256 threatsDetected, uint256 uptime, uint256 energyEfficiency, bytes signature)',
  'function getNodeInfo(string nodeId) view returns (tuple)',
  'function getUserNodes(address owner) view returns (string[])',
  'function getNetworkMetrics() view returns (tuple)',
  'function claimRewards()',
  'event NodeRegistered(string indexed nodeId, address indexed owner, uint8 deviceType)',
  'event ThreatDetected(string indexed nodeId, uint256 threatCount, uint256 reward)',
];

const ORACLE_ABI = [
  'function submitThreatAlert(bytes32 alertId, string threatType, uint8 confidence, address contractAddress, bytes32 transactionHash, bytes32 zkProof)',
  'function getThreatAlert(bytes32 alertId) view returns (tuple)',
  'function getActiveThreatAlerts() view returns (bytes32[])',
  'function getNetworkStats() view returns (uint256, uint256, uint256, uint256)',
  'event ThreatDetected(bytes32 indexed alertId, string threatType, uint8 confidence)',
];

// Network configurations - CORRECTED U2U NETWORKS
export const NETWORKS = {
  u2uTestnet: {
    chainId: 2484,
    name: 'U2U Nebulas Testnet',
    rpcUrl: process.env.NEXT_PUBLIC_U2U_TESTNET_RPC || 'https://rpc-nebulas-testnet.u2u.xyz',
    explorerUrl: 'https://testnet-explorer.u2u.xyz',
    currency: 'U2U',
  },
  u2uMainnet: {
    chainId: 39,
    name: 'U2U Solaris Mainnet',
    rpcUrl: process.env.NEXT_PUBLIC_U2U_MAINNET_RPC || 'https://rpc-mainnet.u2u.xyz',
    explorerUrl: 'https://explorer.u2u.xyz',
    currency: 'U2U',
  },
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://mainnet.infura.io/v3/your-key',
    explorerUrl: 'https://etherscan.io',
    currency: 'ETH',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    currency: 'MATIC',
  },
};

// Contract addresses (loaded from deployment)
export const CONTRACT_ADDRESSES = {
  dagToken: process.env.NEXT_PUBLIC_DAGSHIELD_TOKEN || '',
  nodeRegistry: process.env.NEXT_PUBLIC_NODE_REGISTRY || '',
  oracle: process.env.NEXT_PUBLIC_ORACLE || '',
};

// Real blockchain client
export class BlockchainClient {
  private provider: JsonRpcProvider;
  private signer: Signer | null = null;
  private contracts: Record<string, Contract> = {};
  private network: string;

  constructor(network: string = 'u2uTestnet') {
    this.network = network;
    const networkConfig = NETWORKS[network as keyof typeof NETWORKS];
    
    if (!networkConfig) {
      throw new Error(`Unsupported network: ${network}`);
    }

    this.provider = new JsonRpcProvider(networkConfig.rpcUrl);
    this.initializeContracts();
  }

  /**
   * Connect wallet and initialize signer
   */
  async connectWallet(): Promise<string> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not found');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Switch to correct network
      await this.switchNetwork();

      // Create signer
      const browserProvider = new BrowserProvider(window.ethereum);
      this.signer = await browserProvider.getSigner();

      // Reinitialize contracts with signer
      this.initializeContracts();

      console.log('✅ Wallet connected:', accounts[0]);
      return accounts[0];

    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      throw error;
    }
  }

  /**
   * Switch to the correct network
   */
  async switchNetwork(): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }

    const networkConfig = NETWORKS[this.network as keyof typeof NETWORKS];
    const chainIdHex = `0x${networkConfig.chainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError: unknown) {
      // Network not added to wallet
      if ((switchError as { code?: number }).code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: networkConfig.name,
                rpcUrls: [networkConfig.rpcUrl],
                blockExplorerUrls: [networkConfig.explorerUrl],
                nativeCurrency: {
                  name: networkConfig.currency,
                  symbol: networkConfig.currency,
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError) {
          console.error('❌ Failed to add network:', addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Initialize smart contracts
   */
  private initializeContracts(): void {
    const providerOrSigner = this.signer || this.provider;

    if (CONTRACT_ADDRESSES.dagToken) {
      this.contracts.dagToken = new Contract(
        CONTRACT_ADDRESSES.dagToken,
        DAG_SHIELD_TOKEN_ABI,
        providerOrSigner
      );
    }

    if (CONTRACT_ADDRESSES.nodeRegistry) {
      this.contracts.nodeRegistry = new Contract(
        CONTRACT_ADDRESSES.nodeRegistry,
        NODE_REGISTRY_ABI,
        providerOrSigner
      );
    }

    if (CONTRACT_ADDRESSES.oracle) {
      this.contracts.oracle = new Contract(
        CONTRACT_ADDRESSES.oracle,
        ORACLE_ABI,
        providerOrSigner
      );
    }
  }

  /**
   * Get REAL user balance from blockchain
   */
  async getUserBalance(address: string): Promise<string> {
    try {
      if (!this.contracts.dagToken) {
        throw new Error('DAG Token contract not initialized');
      }

      const balance = await this.contracts.dagToken.balanceOf(address);
      return formatEther(balance);
    } catch (error) {
      console.error('❌ Failed to get user balance:', error);
      throw error;
    }
  }

  /**
   * Get REAL staked amount from blockchain
   */
  async getStakedAmount(address: string): Promise<string> {
    try {
      if (!this.contracts.dagToken) {
        throw new Error('DAG Token contract not initialized');
      }

      const staked = await this.contracts.dagToken.getStakedAmount(address);
      return formatEther(staked);
    } catch (error) {
      console.error('❌ Failed to get staked amount:', error);
      throw error;
    }
  }

  /**
   * Stake tokens on REAL blockchain
   */
  async stakeTokens(amount: string): Promise<string> {
    try {
      if (!this.contracts.dagToken || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }

      const amountWei = parseEther(amount);
      const tx = await this.contracts.dagToken.stake(amountWei);
      
      console.log('📤 Staking transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Staking confirmed:', receipt.transactionHash);
      
      return receipt.transactionHash;
    } catch (error) {
      console.error('❌ Staking failed:', error);
      throw error;
    }
  }

  /**
   * Unstake tokens from REAL blockchain
   */
  async unstakeTokens(amount: string): Promise<string> {
    try {
      if (!this.contracts.dagToken || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }

      const amountWei = parseEther(amount);
      const tx = await this.contracts.dagToken.unstake(amountWei);
      
      console.log('📤 Unstaking transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Unstaking confirmed:', receipt.transactionHash);
      
      return receipt.transactionHash;
    } catch (error) {
      console.error('❌ Unstaking failed:', error);
      throw error;
    }
  }

  /**
   * Deploy REAL node on blockchain
   */
  async deployNode(
    stakeAmount: string,
    region: string,
    deviceType: number,
    capabilities: number[],
    hardwareSpecs: {
      cpuCores: number;
      ramGb: number;
      storageGb: number;
      networkBandwidthMbps: number;
      powerConsumptionWatts: number;
    }
  ): Promise<{ txHash: string; nodeId: string }> {
    try {
      if (!this.contracts.nodeRegistry || !this.signer) {
        throw new Error('Contract or signer not initialized');
      }

      const nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const stakeAmountWei = parseEther(stakeAmount);

      const tx = await this.contracts.nodeRegistry.registerNode(
        nodeId,
        deviceType,
        capabilities,
        region,
        stakeAmountWei,
        [
          hardwareSpecs.cpuCores,
          hardwareSpecs.ramGb,
          hardwareSpecs.storageGb,
          hardwareSpecs.networkBandwidthMbps,
          hardwareSpecs.powerConsumptionWatts,
        ]
      );

      console.log('📤 Node deployment transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Node deployment confirmed:', receipt.transactionHash);

      return {
        txHash: receipt.transactionHash,
        nodeId,
      };
    } catch (error) {
      console.error('❌ Node deployment failed:', error);
      throw error;
    }
  }

  /**
   * Get REAL user nodes from blockchain
   */
  async getUserNodes(address: string): Promise<string[]> {
    try {
      if (!this.contracts.nodeRegistry) {
        throw new Error('Node Registry contract not initialized');
      }

      const nodeIds = await this.contracts.nodeRegistry.getUserNodes(address);
      return nodeIds;
    } catch (error) {
      console.error('❌ Failed to get user nodes:', error);
      throw error;
    }
  }

  /**
   * Get REAL node information from blockchain
   */
  async getNodeInfo(nodeId: string): Promise<unknown> {
    try {
      if (!this.contracts.nodeRegistry) {
        throw new Error('Node Registry contract not initialized');
      }

      const nodeInfo = await this.contracts.nodeRegistry.getNodeInfo(nodeId);
      return nodeInfo;
    } catch (error) {
      console.error('❌ Failed to get node info:', error);
      throw error;
    }
  }

  /**
   * Get REAL network metrics from blockchain
   */
  async getNetworkMetrics(): Promise<{
    totalNodes: number;
    activeNodes: number;
    totalStaked: string;
    totalRewards: string;
  }> {
    try {
      if (!this.contracts.nodeRegistry) {
        throw new Error('Node Registry contract not initialized');
      }

      const metrics = await this.contracts.nodeRegistry.getNetworkMetrics();

      return {
        totalNodes: Number(metrics.totalNodes),
        activeNodes: Number(metrics.activeNodes),
        totalStaked: formatUnits(metrics.totalStaked, 'ether'),
        totalRewards: formatUnits(metrics.totalRewards, 'ether'),
      };
    } catch (error) {
      console.error('❌ Failed to get network metrics:', error);
      throw error;
    }
  }

  /**
   * Submit REAL threat alert to blockchain
   */
  async submitThreatAlert(
    threatType: string,
    confidence: number,
    contractAddress: string,
    transactionHash: string,
    zkProof: string
  ): Promise<string> {
    try {
      if (!this.contracts.oracle || !this.signer) {
        throw new Error('Oracle contract or signer not initialized');
      }

      const alertId = keccak256(
        toUtf8Bytes(`${threatType}-${Date.now()}`)
      );

      const tx = await this.contracts.oracle.submitThreatAlert(
        alertId,
        threatType,
        confidence,
        contractAddress,
        transactionHash,
        zkProof
      );

      console.log('📤 Threat alert transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Threat alert confirmed:', receipt.transactionHash);

      return receipt.transactionHash;
    } catch (error) {
      console.error('❌ Threat alert submission failed:', error);
      throw error;
    }
  }

  /**
   * Get REAL threat alerts from blockchain
   */
  async getActiveThreatAlerts(): Promise<string[]> {
    try {
      if (!this.contracts.oracle) {
        throw new Error('Oracle contract not initialized');
      }

      const alertIds = await this.contracts.oracle.getActiveThreatAlerts();
      return alertIds;
    } catch (error) {
      console.error('❌ Failed to get threat alerts:', error);
      throw error;
    }
  }

  /**
   * Listen to REAL blockchain events
   */
  setupEventListeners(callbacks: {
    onStaked?: (user: string, amount: string) => void;
    onNodeDeployed?: (nodeId: string, owner: string) => void;
    onThreatDetected?: (alertId: string, threatType: string) => void;
  }): void {
    if (this.contracts.dagToken && callbacks.onStaked) {
      this.contracts.dagToken.on('Staked', (user, amount) => {
        callbacks.onStaked!(user, formatEther(amount));
      });
    }

    if (this.contracts.nodeRegistry && callbacks.onNodeDeployed) {
      this.contracts.nodeRegistry.on('NodeRegistered', (nodeId, owner) => {
        callbacks.onNodeDeployed!(nodeId, owner);
      });
    }

    if (this.contracts.oracle && callbacks.onThreatDetected) {
      this.contracts.oracle.on('ThreatDetected', (alertId, threatType) => {
        callbacks.onThreatDetected!(alertId, threatType);
      });
    }
  }

  /**
   * Get current network info
   */
  getNetworkInfo(): { name: string; chainId: number; currency: string } {
    const networkConfig = NETWORKS[this.network as keyof typeof NETWORKS];
    return {
      name: networkConfig.name,
      chainId: networkConfig.chainId,
      currency: networkConfig.currency,
    };
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<unknown> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      console.error('❌ Failed to get transaction receipt:', error);
      throw error;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.provider.send('eth_gasPrice', []);
      const gasPriceBigInt = BigInt(gasPrice);
      return formatUnits(gasPriceBigInt, 'gwei');
    } catch (error) {
      console.error('❌ Failed to get gas price:', error);
      throw error;
    }
  }
}

// Singleton instances to prevent multiple initialization
let blockchainClient: BlockchainClient | null = null;
let isInitializing = false;

/**
 * Get blockchain client instance (singleton to prevent WalletConnect issues)
 */
export function getBlockchainClient(network?: string): BlockchainClient {
  // Prevent multiple initialization
  if (isInitializing) {
    return blockchainClient || new BlockchainClient(network);
  }

  if (!blockchainClient || (network && blockchainClient.getNetworkInfo().name !== network)) {
    isInitializing = true;
    blockchainClient = new BlockchainClient(network);
    isInitializing = false;
  }
  return blockchainClient;
}

/**
 * Reset blockchain client (for network switching)
 */
export function resetBlockchainClient(): void {
  blockchainClient = null;
  isInitializing = false;
}

/**
 * Hook for React components to use blockchain
 */
export function useBlockchain(network?: string) {
  const client = getBlockchainClient(network);
  
  return {
    client,
    connectWallet: () => client.connectWallet(),
    getUserBalance: (address: string) => client.getUserBalance(address),
    getStakedAmount: (address: string) => client.getStakedAmount(address),
    stakeTokens: (amount: string) => client.stakeTokens(amount),
    unstakeTokens: (amount: string) => client.unstakeTokens(amount),
    deployNode: (params: NodeDeploymentParams) => client.deployNode(params.stakeAmount, params.region, params.deviceType, params.capabilities, params.hardwareSpecs),
    getUserNodes: (address: string) => client.getUserNodes(address),
    getNetworkMetrics: () => client.getNetworkMetrics(),
    submitThreatAlert: (params: ThreatAlertParams) => client.submitThreatAlert(params.threatType, params.confidence, params.contractAddress, params.transactionHash, params.zkProof),
    getActiveThreatAlerts: () => client.getActiveThreatAlerts(),
    setupEventListeners: (callbacks: {
      onStaked?: (user: string, amount: string) => void;
      onNodeDeployed?: (nodeId: string, owner: string) => void;
      onThreatDetected?: (alertId: string, threatType: string) => void;
    }) => client.setupEventListeners(callbacks),
    getNetworkInfo: () => client.getNetworkInfo(),
  };
}

// Export types
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  balance: string;
  stakedAmount: string;
  network: string;
}

export interface NodeDeploymentParams {
  stakeAmount: string;
  region: string;
  deviceType: number;
  capabilities: number[];
  hardwareSpecs: {
    cpuCores: number;
    ramGb: number;
    storageGb: number;
    networkBandwidthMbps: number;
    powerConsumptionWatts: number;
  };
}

export interface ThreatAlertParams {
  threatType: string;
  confidence: number;
  contractAddress: string;
  transactionHash: string;
  zkProof: string;
}
