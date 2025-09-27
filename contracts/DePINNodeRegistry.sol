// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./DAGShieldToken.sol";

/**
 * @title DePIN Node Registry
 * @dev Registry for decentralized physical infrastructure nodes in DAGShield network
 * Handles device registration, reputation, rewards, and gamification
 */
contract DePINNodeRegistry is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;

    // Node Types
    enum DeviceType { Mobile, Desktop, IoT, Server, EdgeDevice }
    enum NodeStatus { Inactive, Active, Maintenance, Slashed }
    enum NodeCapability { ThreatDetection, DataStorage, Compute, Networking, EnergyMonitoring }

    // Structs
    struct DePINNode {
        address owner;
        string nodeId;
        DeviceType deviceType;
        NodeCapability[] capabilities;
        string location;
        uint256 stakeAmount;
        uint256 reputationScore; // 0-10000 (100.00%)
        uint256 energyEfficiency; // 0-10000 (100.00%)
        HardwareSpecs hardwareSpecs;
        NodeStatus status;
        uint256 registrationTime;
        uint256 lastActiveTime;
        uint256 totalRewards;
        uint256 threatsDetected;
        uint256 uptime; // in seconds
        bool isVerified;
    }

    struct HardwareSpecs {
        uint32 cpuCores;
        uint32 ramGb;
        uint32 storageGb;
        uint32 networkBandwidthMbps;
        uint32 powerConsumptionWatts;
    }

    struct NodeMetrics {
        uint256 totalNodes;
        uint256 activeNodes;
        uint256 totalStaked;
        uint256 totalRewards;
        uint256 avgReputationScore;
        uint256 totalThreatsDetected;
        uint256 networkUptime;
    }

    struct RewardDistribution {
        uint256 threatDetectionRewards;
        uint256 uptimeRewards;
        uint256 energyEfficiencyBonus;
        uint256 reputationBonus;
        uint256 gamificationRewards;
    }

    struct Challenge {
        uint256 id;
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 rewardPool;
        uint256 minParticipants;
        mapping(address => bool) participants;
        mapping(address => uint256) scores;
        address[] leaderboard;
        bool isActive;
    }

    // State Variables
    DAGShieldToken public immutable dagToken;
    
    mapping(string => DePINNode) public nodes;
    mapping(address => string[]) public ownerNodes;
    mapping(DeviceType => uint256) public deviceTypeCounts;
    mapping(address => uint256) public nodeRewards;
    mapping(address => uint256) public lastRewardClaim;
    
    string[] public allNodeIds;
    NodeMetrics public networkMetrics;
    
    // Gamification
    mapping(uint256 => Challenge) public challenges;
    mapping(address => uint256) public playerLevels;
    mapping(address => uint256) public experiencePoints;
    mapping(address => uint256) public achievementCount;
    
    uint256 public currentChallengeId;
    uint256 public constant MIN_STAKE = 1000 * 10**18; // 1000 DAG
    uint256 public constant MAX_NODES_PER_OWNER = 10;
    uint256 public constant REPUTATION_DECAY_RATE = 100; // 1% per day
    uint256 public constant ENERGY_EFFICIENCY_THRESHOLD = 8000; // 80%
    
    // Reward rates (per day, in basis points)
    uint256 public constant BASE_REWARD_RATE = 100; // 1%
    uint256 public constant REPUTATION_MULTIPLIER = 50; // 0.5%
    uint256 public constant ENERGY_BONUS_RATE = 25; // 0.25%
    uint256 public constant UPTIME_BONUS_RATE = 30; // 0.3%

    // Events
    event NodeRegistered(string indexed nodeId, address indexed owner, DeviceType deviceType);
    event NodeStatusUpdated(string indexed nodeId, NodeStatus oldStatus, NodeStatus newStatus);
    event ThreatDetected(string indexed nodeId, uint256 threatCount, uint256 reward);
    event RewardsClaimed(address indexed owner, uint256 amount);
    event ReputationUpdated(string indexed nodeId, uint256 oldScore, uint256 newScore);
    event ChallengeCreated(uint256 indexed challengeId, string name, uint256 rewardPool);
    event ChallengeCompleted(uint256 indexed challengeId, address indexed winner, uint256 reward);
    event NodeSlashed(string indexed nodeId, uint256 slashAmount, string reason);
    event EnergyEfficiencyUpdated(string indexed nodeId, uint256 efficiency);

    constructor(address _dagToken) {
        dagToken = DAGShieldToken(_dagToken);
        currentChallengeId = 1;
    }

    /**
     * @dev Register a new DePIN node
     */
    function registerNode(
        string memory nodeId,
        DeviceType deviceType,
        NodeCapability[] memory capabilities,
        string memory location,
        uint256 stakeAmount,
        HardwareSpecs memory hardwareSpecs
    ) external nonReentrant whenNotPaused {
        require(bytes(nodeId).length > 0, "Invalid node ID");
        require(stakeAmount >= MIN_STAKE, "Insufficient stake amount");
        require(ownerNodes[msg.sender].length < MAX_NODES_PER_OWNER, "Max nodes exceeded");
        require(nodes[nodeId].owner == address(0), "Node already registered");

        // Transfer stake to contract
        require(
            dagToken.transferFrom(msg.sender, address(this), stakeAmount),
            "Stake transfer failed"
        );

        // Create node
        DePINNode storage node = nodes[nodeId];
        node.owner = msg.sender;
        node.nodeId = nodeId;
        node.deviceType = deviceType;
        node.capabilities = capabilities;
        node.location = location;
        node.stakeAmount = stakeAmount;
        node.reputationScore = 5000; // Start at 50%
        node.energyEfficiency = 7000; // Start at 70%
        node.hardwareSpecs = hardwareSpecs;
        node.status = NodeStatus.Active;
        node.registrationTime = block.timestamp;
        node.lastActiveTime = block.timestamp;
        node.isVerified = false;

        // Update mappings
        ownerNodes[msg.sender].push(nodeId);
        allNodeIds.push(nodeId);
        deviceTypeCounts[deviceType]++;

        // Update network metrics
        networkMetrics.totalNodes++;
        networkMetrics.activeNodes++;
        networkMetrics.totalStaked += stakeAmount;

        // Initialize player if first node
        if (ownerNodes[msg.sender].length == 1) {
            playerLevels[msg.sender] = 1;
            experiencePoints[msg.sender] = 0;
        }

        emit NodeRegistered(nodeId, msg.sender, deviceType);
    }

    /**
     * @dev Update node status and metrics
     */
    function updateNodeMetrics(
        string memory nodeId,
        uint256 threatsDetected,
        uint256 uptime,
        uint256 energyEfficiency,
        bytes memory signature
    ) external nonReentrant {
        DePINNode storage node = nodes[nodeId];
        require(node.owner != address(0), "Node not found");
        require(node.status == NodeStatus.Active, "Node not active");

        // Verify signature (simplified - in production use proper oracle verification)
        bytes32 messageHash = keccak256(abi.encodePacked(nodeId, threatsDetected, uptime, energyEfficiency));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        require(signer == node.owner, "Invalid signature");

        // Update node metrics
        uint256 oldThreats = node.threatsDetected;
        uint256 newThreats = threatsDetected - oldThreats;
        
        node.threatsDetected = threatsDetected;
        node.uptime += uptime;
        node.energyEfficiency = energyEfficiency;
        node.lastActiveTime = block.timestamp;

        // Update reputation based on performance
        _updateReputation(nodeId, newThreats, uptime, energyEfficiency);

        // Calculate and distribute rewards
        uint256 reward = _calculateRewards(nodeId, newThreats, uptime, energyEfficiency);
        if (reward > 0) {
            nodeRewards[node.owner] += reward;
            node.totalRewards += reward;
            networkMetrics.totalRewards += reward;

            // Add experience points for gamification
            experiencePoints[node.owner] += (reward / 10**18); // 1 XP per DAG
            _checkLevelUp(node.owner);

            emit ThreatDetected(nodeId, newThreats, reward);
        }

        // Update network metrics
        networkMetrics.totalThreatsDetected += newThreats;
        _updateNetworkMetrics();
    }

    /**
     * @dev Claim accumulated rewards
     */
    function claimRewards() external nonReentrant {
        uint256 reward = nodeRewards[msg.sender];
        require(reward > 0, "No rewards to claim");

        nodeRewards[msg.sender] = 0;
        lastRewardClaim[msg.sender] = block.timestamp;

        // Mint rewards (assuming DAGShieldToken has minting capability)
        require(dagToken.transfer(msg.sender, reward), "Reward transfer failed");

        emit RewardsClaimed(msg.sender, reward);
    }

    /**
     * @dev Create a new gamification challenge
     */
    function createChallenge(
        string memory name,
        string memory description,
        uint256 duration,
        uint256 rewardPool,
        uint256 minParticipants
    ) external onlyOwner {
        require(rewardPool > 0, "Invalid reward pool");
        require(duration > 0, "Invalid duration");

        Challenge storage challenge = challenges[currentChallengeId];
        challenge.id = currentChallengeId;
        challenge.name = name;
        challenge.description = description;
        challenge.startTime = block.timestamp;
        challenge.endTime = block.timestamp + duration;
        challenge.rewardPool = rewardPool;
        challenge.minParticipants = minParticipants;
        challenge.isActive = true;

        emit ChallengeCreated(currentChallengeId, name, rewardPool);
        currentChallengeId++;
    }

    /**
     * @dev Participate in a challenge
     */
    function participateInChallenge(uint256 challengeId) external {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.isActive, "Challenge not active");
        require(block.timestamp < challenge.endTime, "Challenge ended");
        require(!challenge.participants[msg.sender], "Already participating");
        require(ownerNodes[msg.sender].length > 0, "No nodes registered");

        challenge.participants[msg.sender] = true;
        challenge.leaderboard.push(msg.sender);
    }

    /**
     * @dev Update challenge score
     */
    function updateChallengeScore(
        uint256 challengeId,
        address participant,
        uint256 score
    ) external onlyOwner {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.isActive, "Challenge not active");
        require(challenge.participants[participant], "Not participating");

        challenge.scores[participant] = score;
    }

    /**
     * @dev Complete challenge and distribute rewards
     */
    function completeChallenge(uint256 challengeId) external onlyOwner {
        Challenge storage challenge = challenges[challengeId];
        require(challenge.isActive, "Challenge not active");
        require(block.timestamp >= challenge.endTime, "Challenge not ended");

        challenge.isActive = false;

        // Find winner (highest score)
        address winner = address(0);
        uint256 highestScore = 0;

        for (uint256 i = 0; i < challenge.leaderboard.length; i++) {
            address participant = challenge.leaderboard[i];
            uint256 score = challenge.scores[participant];
            
            if (score > highestScore) {
                highestScore = score;
                winner = participant;
            }
        }

        // Distribute rewards
        if (winner != address(0) && challenge.leaderboard.length >= challenge.minParticipants) {
            nodeRewards[winner] += challenge.rewardPool;
            achievementCount[winner]++;
            experiencePoints[winner] += 1000; // Bonus XP for winning
            
            emit ChallengeCompleted(challengeId, winner, challenge.rewardPool);
        }
    }

    /**
     * @dev Slash node for malicious behavior
     */
    function slashNode(
        string memory nodeId,
        uint256 slashAmount,
        string memory reason
    ) external onlyOwner {
        DePINNode storage node = nodes[nodeId];
        require(node.owner != address(0), "Node not found");
        require(slashAmount <= node.stakeAmount, "Slash amount too high");

        node.stakeAmount -= slashAmount;
        node.status = NodeStatus.Slashed;
        node.reputationScore = node.reputationScore / 2; // Halve reputation

        // Update network metrics
        networkMetrics.activeNodes--;
        networkMetrics.totalStaked -= slashAmount;

        emit NodeSlashed(nodeId, slashAmount, reason);
    }

    /**
     * @dev Update node reputation based on performance
     */
    function _updateReputation(
        string memory nodeId,
        uint256 newThreats,
        uint256 uptime,
        uint256 energyEfficiency
    ) internal {
        DePINNode storage node = nodes[nodeId];
        uint256 oldReputation = node.reputationScore;
        uint256 newReputation = oldReputation;

        // Increase reputation for threat detection
        if (newThreats > 0) {
            newReputation += (newThreats * 10); // 10 points per threat
        }

        // Increase reputation for high uptime
        if (uptime > 86400) { // More than 1 day
            newReputation += 50;
        }

        // Increase reputation for energy efficiency
        if (energyEfficiency > ENERGY_EFFICIENCY_THRESHOLD) {
            newReputation += 25;
        }

        // Apply daily decay
        uint256 daysSinceLastUpdate = (block.timestamp - node.lastActiveTime) / 86400;
        if (daysSinceLastUpdate > 0) {
            uint256 decay = (newReputation * REPUTATION_DECAY_RATE * daysSinceLastUpdate) / 10000;
            newReputation = newReputation > decay ? newReputation - decay : 0;
        }

        // Cap reputation at 10000 (100%)
        node.reputationScore = newReputation > 10000 ? 10000 : newReputation;

        if (node.reputationScore != oldReputation) {
            emit ReputationUpdated(nodeId, oldReputation, node.reputationScore);
        }
    }

    /**
     * @dev Calculate rewards based on node performance
     */
    function _calculateRewards(
        string memory nodeId,
        uint256 newThreats,
        uint256 uptime,
        uint256 energyEfficiency
    ) internal view returns (uint256) {
        DePINNode storage node = nodes[nodeId];
        
        // Base reward based on stake
        uint256 baseReward = (node.stakeAmount * BASE_REWARD_RATE) / 10000;
        
        // Reputation multiplier
        uint256 reputationMultiplier = (node.reputationScore * REPUTATION_MULTIPLIER) / 10000;
        
        // Energy efficiency bonus
        uint256 energyBonus = energyEfficiency > ENERGY_EFFICIENCY_THRESHOLD ?
            (baseReward * ENERGY_BONUS_RATE) / 10000 : 0;
        
        // Uptime bonus
        uint256 uptimeBonus = uptime > 86400 ? // More than 1 day
            (baseReward * UPTIME_BONUS_RATE) / 10000 : 0;
        
        // Threat detection bonus
        uint256 threatBonus = newThreats * 100 * 10**18; // 100 DAG per threat
        
        return baseReward + reputationMultiplier + energyBonus + uptimeBonus + threatBonus;
    }

    /**
     * @dev Check and handle level up
     */
    function _checkLevelUp(address player) internal {
        uint256 currentLevel = playerLevels[player];
        uint256 xp = experiencePoints[player];
        uint256 requiredXP = currentLevel * 1000; // 1000 XP per level
        
        if (xp >= requiredXP) {
            playerLevels[player] = currentLevel + 1;
            // Bonus rewards for leveling up
            nodeRewards[player] += (currentLevel * 100 * 10**18); // 100 DAG per level
        }
    }

    /**
     * @dev Update network-wide metrics
     */
    function _updateNetworkMetrics() internal {
        uint256 totalReputation = 0;
        uint256 totalUptime = 0;
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allNodeIds.length; i++) {
            DePINNode storage node = nodes[allNodeIds[i]];
            if (node.status == NodeStatus.Active) {
                totalReputation += node.reputationScore;
                totalUptime += node.uptime;
                activeCount++;
            }
        }

        if (activeCount > 0) {
            networkMetrics.avgReputationScore = totalReputation / activeCount;
            networkMetrics.networkUptime = totalUptime / activeCount;
        }
        
        networkMetrics.activeNodes = activeCount;
    }

    // View functions
    function getNodeInfo(string memory nodeId) external view returns (DePINNode memory) {
        return nodes[nodeId];
    }

    function getOwnerNodes(address owner) external view returns (string[] memory) {
        return ownerNodes[owner];
    }

    function getNetworkMetrics() external view returns (NodeMetrics memory) {
        return networkMetrics;
    }

    function getPlayerStats(address player) external view returns (
        uint256 level,
        uint256 xp,
        uint256 achievements,
        uint256 totalRewards
    ) {
        return (
            playerLevels[player],
            experiencePoints[player],
            achievementCount[player],
            nodeRewards[player]
        );
    }

    function getChallengeInfo(uint256 challengeId) external view returns (
        string memory name,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 rewardPool,
        bool isActive
    ) {
        Challenge storage challenge = challenges[challengeId];
        return (
            challenge.name,
            challenge.description,
            challenge.startTime,
            challenge.endTime,
            challenge.rewardPool,
            challenge.isActive
        );
    }

    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(dagToken.transfer(owner(), amount), "Emergency withdraw failed");
    }
}
