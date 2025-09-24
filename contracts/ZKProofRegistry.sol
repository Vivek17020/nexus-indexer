// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ZKProofRegistry {
    struct ProofSubmission {
        string eventId;
        bytes32 commitmentHash;
        address submitter;
        uint256 timestamp;
        bool verified;
    }
    
    mapping(bytes32 => ProofSubmission) public proofs;
    mapping(address => bytes32[]) public userProofs;
    mapping(string => bytes32[]) public eventProofs;
    
    bytes32[] public allProofs;
    
    event ProofSubmitted(
        bytes32 indexed proofId,
        string indexed eventId,
        address indexed submitter,
        bytes32 commitmentHash,
        uint256 timestamp
    );
    
    event ProofVerified(
        bytes32 indexed proofId,
        bool verified
    );
    
    function submitProof(
        string memory eventId,
        string memory proofString
    ) external returns (bytes32) {
        // Convert proofString to commitment hash
        bytes32 commitmentHash = keccak256(abi.encodePacked(proofString));
        
        // Create unique proof ID
        bytes32 proofId = keccak256(abi.encodePacked(
            eventId,
            commitmentHash,
            msg.sender,
            block.timestamp
        ));
        
        // Ensure proof doesn't already exist
        require(proofs[proofId].timestamp == 0, "Proof already exists");
        
        // Store proof
        proofs[proofId] = ProofSubmission({
            eventId: eventId,
            commitmentHash: commitmentHash,
            submitter: msg.sender,
            timestamp: block.timestamp,
            verified: false
        });
        
        // Update indexes
        userProofs[msg.sender].push(proofId);
        eventProofs[eventId].push(proofId);
        allProofs.push(proofId);
        
        emit ProofSubmitted(proofId, eventId, msg.sender, commitmentHash, block.timestamp);
        
        return proofId;
    }
    
    function verifyProof(bytes32 proofId, bool isValid) external {
        // In a real implementation, this would have access control
        // For demo purposes, anyone can verify
        require(proofs[proofId].timestamp != 0, "Proof does not exist");
        
        proofs[proofId].verified = isValid;
        
        emit ProofVerified(proofId, isValid);
    }
    
    function getProof(bytes32 proofId) external view returns (
        string memory eventId,
        bytes32 commitmentHash,
        address submitter,
        uint256 timestamp,
        bool verified
    ) {
        ProofSubmission memory proof = proofs[proofId];
        require(proof.timestamp != 0, "Proof does not exist");
        
        return (
            proof.eventId,
            proof.commitmentHash,
            proof.submitter,
            proof.timestamp,
            proof.verified
        );
    }
    
    function getUserProofs(address user) external view returns (bytes32[] memory) {
        return userProofs[user];
    }
    
    function getEventProofs(string memory eventId) external view returns (bytes32[] memory) {
        return eventProofs[eventId];
    }
    
    function getTotalProofs() external view returns (uint256) {
        return allProofs.length;
    }
}