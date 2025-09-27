/*!
 * Zero-Knowledge Proof System for DAGShield
 * Privacy-preserving threat detection with ZK-SNARKs
 */

use anyhow::{Context, Result};
use ark_bn254::{Bn254, Fr, G1Projective, G2Projective};
use ark_groth16::{
    create_random_proof, generate_random_parameters, prepare_verifying_key, verify_proof,
    Parameters, PreparedVerifyingKey, Proof, ProvingKey, VerifyingKey,
};
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize};
use ark_std::{rand::RngCore, UniformRand};
use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};
use std::{
    collections::HashMap,
    fs,
    path::Path,
    sync::{Arc, RwLock},
};
use tracing::{debug, error, info, warn};

/// ZK Circuit for threat detection
#[derive(Clone, Debug)]
pub struct ThreatDetectionCircuit {
    // Public inputs
    pub threat_hash: Option<Fr>,
    pub confidence_threshold: Option<Fr>,
    
    // Private inputs (witness)
    pub transaction_data: Option<Vec<Fr>>,
    pub ai_model_weights: Option<Vec<Fr>>,
    pub node_reputation: Option<Fr>,
    pub detection_algorithm: Option<Fr>,
}

/// ZK Proof for threat detection
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ThreatProof {
    pub proof: Vec<u8>,
    pub public_inputs: Vec<String>,
    pub verification_key_hash: String,
    pub timestamp: u64,
    pub node_id: String,
}

/// ZK Proving System
pub struct ZKProver {
    pub enabled: bool,
    pub proving_key: Option<ProvingKey<Bn254>>,
    pub verifying_key: Option<VerifyingKey<Bn254>>,
    pub prepared_vk: Option<PreparedVerifyingKey<Bn254>>,
    pub circuit_cache: Arc<RwLock<HashMap<String, ThreatDetectionCircuit>>>,
    pub proof_cache: Arc<RwLock<HashMap<String, ThreatProof>>>,
}

impl ZKProver {
    /// Create new ZK prover
    pub fn new(enabled: bool) -> Self {
        Self {
            enabled,
            proving_key: None,
            verifying_key: None,
            prepared_vk: None,
            circuit_cache: Arc::new(RwLock::new(HashMap::new())),
            proof_cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Initialize ZK system with trusted setup
    pub async fn initialize(&mut self) -> Result<()> {
        if !self.enabled {
            info!("ZK proofs disabled, skipping initialization");
            return Ok(());
        }

        info!("🔐 Initializing ZK proof system...");

        // Try to load existing parameters
        if let Ok((pk, vk)) = self.load_parameters().await {
            self.proving_key = Some(pk);
            self.verifying_key = Some(vk.clone());
            self.prepared_vk = Some(prepare_verifying_key(&vk));
            info!("✅ Loaded existing ZK parameters");
        } else {
            // Generate new parameters (trusted setup)
            info!("🔧 Generating new ZK parameters (this may take a while)...");
            let (pk, vk) = self.generate_parameters().await?;
            
            self.proving_key = Some(pk.clone());
            self.verifying_key = Some(vk.clone());
            self.prepared_vk = Some(prepare_verifying_key(&vk));
            
            // Save parameters for future use
            self.save_parameters(&pk, &vk).await?;
            info!("✅ Generated and saved new ZK parameters");
        }

        Ok(())
    }

    /// Generate ZK proof for threat detection
    pub async fn generate_threat_proof(
        &self,
        transaction_data: &[u8],
        ai_confidence: f64,
        node_id: &str,
    ) -> Result<ThreatProof> {
        if !self.enabled {
            return Err(anyhow::anyhow!("ZK proofs are disabled"));
        }

        let proving_key = self.proving_key.as_ref()
            .context("Proving key not initialized")?;

        debug!("🔐 Generating ZK proof for threat detection");

        // Convert inputs to field elements
        let transaction_hash = self.hash_to_field(transaction_data);
        let confidence_field = self.float_to_field(ai_confidence);
        let threshold_field = self.float_to_field(0.7); // 70% threshold

        // Create circuit
        let circuit = ThreatDetectionCircuit {
            threat_hash: Some(transaction_hash),
            confidence_threshold: Some(threshold_field),
            transaction_data: Some(self.bytes_to_fields(transaction_data)),
            ai_model_weights: Some(self.generate_mock_weights()),
            node_reputation: Some(self.float_to_field(0.95)), // Mock reputation
            detection_algorithm: Some(confidence_field),
        };

        // Generate proof
        let mut rng = ark_std::rand::thread_rng();
        let proof = create_random_proof(circuit, proving_key, &mut rng)
            .context("Failed to create ZK proof")?;

        // Serialize proof
        let mut proof_bytes = Vec::new();
        proof.serialize_compressed(&mut proof_bytes)
            .context("Failed to serialize proof")?;

        // Public inputs for verification
        let public_inputs = vec![
            self.field_to_string(&transaction_hash),
            self.field_to_string(&threshold_field),
        ];

        let vk_hash = self.hash_verifying_key()?;

        let threat_proof = ThreatProof {
            proof: proof_bytes,
            public_inputs,
            verification_key_hash: vk_hash,
            timestamp: chrono::Utc::now().timestamp() as u64,
            node_id: node_id.to_string(),
        };

        // Cache the proof
        let proof_id = self.generate_proof_id(&threat_proof);
        self.proof_cache.write().unwrap().insert(proof_id, threat_proof.clone());

        debug!("✅ Generated ZK proof successfully");
        Ok(threat_proof)
    }

    /// Verify ZK proof
    pub async fn verify_threat_proof(&self, proof: &ThreatProof) -> Result<bool> {
        if !self.enabled {
            return Ok(true); // Skip verification if ZK is disabled
        }

        let prepared_vk = self.prepared_vk.as_ref()
            .context("Prepared verifying key not initialized")?;

        debug!("🔍 Verifying ZK proof");

        // Deserialize proof
        let zk_proof = Proof::<Bn254>::deserialize_compressed(&proof.proof[..])
            .context("Failed to deserialize proof")?;

        // Convert public inputs back to field elements
        let public_inputs: Result<Vec<Fr>> = proof.public_inputs
            .iter()
            .map(|s| self.string_to_field(s))
            .collect();
        let public_inputs = public_inputs?;

        // Verify proof
        let is_valid = verify_proof(prepared_vk, &zk_proof, &public_inputs)
            .context("Proof verification failed")?;

        if is_valid {
            debug!("✅ ZK proof verification successful");
        } else {
            warn!("❌ ZK proof verification failed");
        }

        Ok(is_valid)
    }

    /// Generate parameters for the circuit (trusted setup)
    async fn generate_parameters(&self) -> Result<(ProvingKey<Bn254>, VerifyingKey<Bn254>)> {
        // Create a dummy circuit for parameter generation
        let circuit = ThreatDetectionCircuit {
            threat_hash: None,
            confidence_threshold: None,
            transaction_data: None,
            ai_model_weights: None,
            node_reputation: None,
            detection_algorithm: None,
        };

        let mut rng = ark_std::rand::thread_rng();
        let params = generate_random_parameters::<Bn254, _, _>(circuit, &mut rng)
            .context("Failed to generate parameters")?;

        Ok((params.0, params.1))
    }

    /// Save ZK parameters to disk
    async fn save_parameters(
        &self,
        pk: &ProvingKey<Bn254>,
        vk: &VerifyingKey<Bn254>,
    ) -> Result<()> {
        let params_dir = Path::new("./zk_params");
        fs::create_dir_all(params_dir)?;

        // Save proving key
        let mut pk_bytes = Vec::new();
        pk.serialize_compressed(&mut pk_bytes)?;
        fs::write(params_dir.join("proving_key.bin"), pk_bytes)?;

        // Save verifying key
        let mut vk_bytes = Vec::new();
        vk.serialize_compressed(&mut vk_bytes)?;
        fs::write(params_dir.join("verifying_key.bin"), vk_bytes)?;

        Ok(())
    }

    /// Load ZK parameters from disk
    async fn load_parameters(&self) -> Result<(ProvingKey<Bn254>, VerifyingKey<Bn254>)> {
        let params_dir = Path::new("./zk_params");

        // Load proving key
        let pk_bytes = fs::read(params_dir.join("proving_key.bin"))?;
        let pk = ProvingKey::<Bn254>::deserialize_compressed(&pk_bytes[..])?;

        // Load verifying key
        let vk_bytes = fs::read(params_dir.join("verifying_key.bin"))?;
        let vk = VerifyingKey::<Bn254>::deserialize_compressed(&vk_bytes[..])?;

        Ok((pk, vk))
    }

    /// Hash data to field element
    fn hash_to_field(&self, data: &[u8]) -> Fr {
        let mut hasher = Keccak256::new();
        hasher.update(data);
        let hash = hasher.finalize();
        
        // Convert hash to field element (mod p)
        Fr::from_le_bytes_mod_order(&hash)
    }

    /// Convert float to field element
    fn float_to_field(&self, value: f64) -> Fr {
        let scaled = (value * 1000000.0) as u64; // Scale to avoid decimals
        Fr::from(scaled)
    }

    /// Convert bytes to field elements
    fn bytes_to_fields(&self, data: &[u8]) -> Vec<Fr> {
        data.chunks(31) // BN254 field elements are ~31 bytes
            .map(|chunk| Fr::from_le_bytes_mod_order(chunk))
            .collect()
    }

    /// Generate mock AI model weights for demo
    fn generate_mock_weights(&self) -> Vec<Fr> {
        let mut rng = ark_std::rand::thread_rng();
        (0..10).map(|_| Fr::rand(&mut rng)).collect()
    }

    /// Convert field element to string
    fn field_to_string(&self, field: &Fr) -> String {
        format!("{:?}", field)
    }

    /// Convert string to field element
    fn string_to_field(&self, s: &str) -> Result<Fr> {
        // This is a simplified conversion - in production, use proper serialization
        let bytes = s.as_bytes();
        Ok(Fr::from_le_bytes_mod_order(bytes))
    }

    /// Hash verifying key for integrity check
    fn hash_verifying_key(&self) -> Result<String> {
        let vk = self.verifying_key.as_ref()
            .context("Verifying key not initialized")?;

        let mut vk_bytes = Vec::new();
        vk.serialize_compressed(&mut vk_bytes)?;

        let mut hasher = Keccak256::new();
        hasher.update(&vk_bytes);
        let hash = hasher.finalize();

        Ok(hex::encode(hash))
    }

    /// Generate unique proof ID
    fn generate_proof_id(&self, proof: &ThreatProof) -> String {
        let mut hasher = Keccak256::new();
        hasher.update(&proof.proof);
        hasher.update(proof.node_id.as_bytes());
        hasher.update(&proof.timestamp.to_le_bytes());
        let hash = hasher.finalize();
        hex::encode(hash)
    }

    /// Get proof statistics
    pub fn get_proof_stats(&self) -> ProofStats {
        let cache = self.proof_cache.read().unwrap();
        ProofStats {
            total_proofs: cache.len(),
            enabled: self.enabled,
            has_parameters: self.proving_key.is_some() && self.verifying_key.is_some(),
        }
    }

    /// Clear proof cache
    pub fn clear_cache(&self) {
        self.proof_cache.write().unwrap().clear();
        self.circuit_cache.write().unwrap().clear();
    }
}

/// Proof statistics
#[derive(Debug, Serialize, Deserialize)]
pub struct ProofStats {
    pub total_proofs: usize,
    pub enabled: bool,
    pub has_parameters: bool,
}

// Implement the constraint system for the circuit
impl ark_relations::r1cs::ConstraintSynthesizer<Fr> for ThreatDetectionCircuit {
    fn generate_constraints(
        self,
        cs: ark_relations::r1cs::ConstraintSystemRef<Fr>,
    ) -> ark_relations::r1cs::Result<()> {
        use ark_r1cs_std::prelude::*;

        // Allocate public inputs
        let threat_hash = FpVar::new_input(cs.clone(), || {
            self.threat_hash.ok_or(ark_relations::r1cs::SynthesisError::AssignmentMissing)
        })?;

        let confidence_threshold = FpVar::new_input(cs.clone(), || {
            self.confidence_threshold.ok_or(ark_relations::r1cs::SynthesisError::AssignmentMissing)
        })?;

        // Allocate private inputs
        let detection_result = FpVar::new_witness(cs.clone(), || {
            self.detection_algorithm.ok_or(ark_relations::r1cs::SynthesisError::AssignmentMissing)
        })?;

        let node_reputation = FpVar::new_witness(cs.clone(), || {
            self.node_reputation.ok_or(ark_relations::r1cs::SynthesisError::AssignmentMissing)
        })?;

        // Constraint 1: Detection result must be above threshold
        let threshold_check = detection_result.is_cmp(&confidence_threshold, std::cmp::Ordering::Greater, false)?;
        threshold_check.enforce_equal(&Boolean::TRUE)?;

        // Constraint 2: Node reputation must be high (> 0.8)
        let reputation_threshold = FpVar::constant(Fr::from(800000u64)); // 0.8 * 1000000
        let reputation_check = node_reputation.is_cmp(&reputation_threshold, std::cmp::Ordering::Greater, false)?;
        reputation_check.enforce_equal(&Boolean::TRUE)?;

        // Constraint 3: Threat hash integrity
        if let Some(tx_data) = &self.transaction_data {
            let computed_hash = self.compute_hash_constraints(cs.clone(), tx_data)?;
            computed_hash.enforce_equal(&threat_hash)?;
        }

        Ok(())
    }
}

impl ThreatDetectionCircuit {
    /// Compute hash constraints within the circuit
    fn compute_hash_constraints(
        &self,
        cs: ark_relations::r1cs::ConstraintSystemRef<Fr>,
        data: &[Fr],
    ) -> ark_relations::r1cs::Result<ark_r1cs_std::fields::fp::FpVar<Fr>> {
        use ark_r1cs_std::prelude::*;

        // Simplified hash computation for demo
        // In production, use proper hash function constraints (Poseidon, etc.)
        let mut result = FpVar::constant(Fr::from(0u64));
        
        for (i, &element) in data.iter().enumerate() {
            let element_var = FpVar::constant(element);
            let multiplier = FpVar::constant(Fr::from((i + 1) as u64));
            result = &result + &element_var * &multiplier;
        }

        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_zk_prover_initialization() {
        let mut prover = ZKProver::new(true);
        assert!(prover.initialize().await.is_ok());
        assert!(prover.proving_key.is_some());
        assert!(prover.verifying_key.is_some());
    }

    #[tokio::test]
    async fn test_proof_generation_and_verification() {
        let mut prover = ZKProver::new(true);
        prover.initialize().await.unwrap();

        let transaction_data = b"test_transaction_data";
        let confidence = 0.85;
        let node_id = "test_node";

        let proof = prover
            .generate_threat_proof(transaction_data, confidence, node_id)
            .await
            .unwrap();

        let is_valid = prover.verify_threat_proof(&proof).await.unwrap();
        assert!(is_valid);
    }

    #[tokio::test]
    async fn test_disabled_zk_prover() {
        let prover = ZKProver::new(false);
        
        let transaction_data = b"test_data";
        let result = prover.generate_threat_proof(transaction_data, 0.8, "node").await;
        assert!(result.is_err());
    }
}
