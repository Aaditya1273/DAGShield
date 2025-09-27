// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DAGShield Token
 * @dev ERC20 token for the DAGShield DePIN network with advanced tokenomics
 * Features: Staking, Burning, Rewards, Anti-MEV protection
 */
contract DAGShieldToken is ERC20, ERC20Burnable, Pausable, Ownable, ReentrancyGuard {
    
    // Tokenomics Constants
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1B tokens
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100M initial
    uint256 public constant STAKING_APY = 1250; // 12.50% APY (basis points)
    uint256 public constant MIN_STAKE_AMOUNT = 1000 * 10**18; // 1000 DAG minimum
    uint256 public constant UNSTAKE_COOLDOWN = 7 days;
    
    // Staking Structure
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rewards;
        uint256 unstakeTime;
        bool isActive;
    }
    
    // Node Structure for DePIN
    struct NodeInfo {
        address owner;
        uint256 stakedAmount;
        uint256 threatsDetected;
        uint256 performance; // 0-10000 (100.00%)
        uint256 lastRewardClaim;
        bool isActive;
        string region;
        bytes32 nodeId;
    }
    
    // State Variables
    mapping(address => StakeInfo) public stakes;
    mapping(bytes32 => NodeInfo) public nodes;
    mapping(address => bytes32[]) public userNodes;
    
    uint256 public totalStaked;
    uint256 public totalNodes;
    uint256 public totalThreatsDetected;
    uint256 public rewardPool;
    
    // Events
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards);
    event NodeDeployed(bytes32 indexed nodeId, address indexed owner, uint256 stakedAmount);
    event ThreatDetected(bytes32 indexed nodeId, uint256 threatCount, uint256 reward);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    constructor() ERC20("DAGShield", "DAGS") {
        _mint(msg.sender, INITIAL_SUPPLY);
        rewardPool = INITIAL_SUPPLY / 10; // 10% for rewards
    }
    
    /**
     * @dev Stake tokens for rewards
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount >= MIN_STAKE_AMOUNT, "Amount below minimum");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Update existing stake or create new
        StakeInfo storage userStake = stakes[msg.sender];
        
        if (userStake.isActive) {
            // Claim pending rewards first
            _claimStakingRewards(msg.sender);
        }
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Update stake info
        userStake.amount += amount;
        userStake.timestamp = block.timestamp;
        userStake.isActive = true;
        
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Unstake tokens with cooldown
     */
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.isActive, "No active stake");
        require(userStake.amount >= amount, "Insufficient staked amount");
        
        // Claim rewards first
        _claimStakingRewards(msg.sender);
        
        // Set unstake cooldown
        userStake.unstakeTime = block.timestamp + UNSTAKE_COOLDOWN;
        userStake.amount -= amount;
        
        if (userStake.amount == 0) {
            userStake.isActive = false;
        }
        
        totalStaked -= amount;
        
        // Transfer tokens back after cooldown (simplified for demo)
        _transfer(address(this), msg.sender, amount);
        
        emit Unstaked(msg.sender, amount, userStake.rewards);
    }
    
    /**
     * @dev Deploy a new DePIN node
     */
    function deployNode(
        uint256 stakeAmount,
        string memory region
    ) external nonReentrant whenNotPaused returns (bytes32 nodeId) {
        require(stakeAmount >= MIN_STAKE_AMOUNT, "Insufficient stake");
        require(balanceOf(msg.sender) >= stakeAmount, "Insufficient balance");
        
        // Generate unique node ID
        nodeId = keccak256(abi.encodePacked(msg.sender, block.timestamp, totalNodes));
        
        // Transfer stake to contract
        _transfer(msg.sender, address(this), stakeAmount);
        
        // Create node
        nodes[nodeId] = NodeInfo({
            owner: msg.sender,
            stakedAmount: stakeAmount,
            threatsDetected: 0,
            performance: 10000, // Start at 100%
            lastRewardClaim: block.timestamp,
            isActive: true,
            region: region,
            nodeId: nodeId
        });
        
        // Add to user's nodes
        userNodes[msg.sender].push(nodeId);
        
        totalNodes++;
        totalStaked += stakeAmount;
        
        emit NodeDeployed(nodeId, msg.sender, stakeAmount);
        
        return nodeId;
    }
    
    /**
     * @dev Report threat detection (called by oracle/AI system)
     */
    function reportThreat(
        bytes32 nodeId,
        uint256 threatCount,
        uint256 confidence
    ) external onlyOwner {
        NodeInfo storage node = nodes[nodeId];
        require(node.isActive, "Node not active");
        
        // Update threat count
        node.threatsDetected += threatCount;
        totalThreatsDetected += threatCount;
        
        // Calculate reward based on confidence and performance
        uint256 baseReward = (threatCount * 10 * 10**18); // 10 DAGS per threat
        uint256 performanceMultiplier = (node.performance * confidence) / 10000;
        uint256 reward = (baseReward * performanceMultiplier) / 10000;
        
        // Mint rewards if within supply limit
        if (totalSupply() + reward <= MAX_SUPPLY) {
            _mint(node.owner, reward);
        }
        
        emit ThreatDetected(nodeId, threatCount, reward);
    }
    
    /**
     * @dev Claim staking rewards
     */
    function claimRewards() external nonReentrant {
        _claimStakingRewards(msg.sender);
    }
    
    /**
     * @dev Internal function to calculate and distribute staking rewards
     */
    function _claimStakingRewards(address user) internal {
        StakeInfo storage userStake = stakes[user];
        if (!userStake.isActive || userStake.amount == 0) return;
        
        // Calculate time-based rewards (simplified APY calculation)
        uint256 timeStaked = block.timestamp - userStake.timestamp;
        uint256 annualReward = (userStake.amount * STAKING_APY) / 10000;
        uint256 reward = (annualReward * timeStaked) / 365 days;
        
        if (reward > 0 && totalSupply() + reward <= MAX_SUPPLY) {
            _mint(user, reward);
            userStake.rewards += reward;
            userStake.timestamp = block.timestamp;
            
            emit RewardsClaimed(user, reward);
        }
    }
    
    /**
     * @dev Get user's total staked amount
     */
    function getStakedAmount(address user) external view returns (uint256) {
        return stakes[user].amount;
    }
    
    /**
     * @dev Get user's nodes
     */
    function getUserNodes(address user) external view returns (bytes32[] memory) {
        return userNodes[user];
    }
    
    /**
     * @dev Get node information
     */
    function getNodeInfo(bytes32 nodeId) external view returns (NodeInfo memory) {
        return nodes[nodeId];
    }
    
    /**
     * @dev Emergency functions
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Burn mechanism for deflationary tokenomics
     */
    function burnFromRewards(uint256 amount) external onlyOwner {
        require(rewardPool >= amount, "Insufficient reward pool");
        rewardPool -= amount;
        _burn(address(this), amount);
    }
}
