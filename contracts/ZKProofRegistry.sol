// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ZKProofRegistry
 * @dev Registry for ZK proofs with NFT minting for valid submissions
 * Deployed on Polygon zkEVM testnet
 */
contract ZKProofRegistry is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    Counters.Counter private _proofCounter;
    
    struct ProofCommitment {
        bytes32 commitment;
        string eventId;
        address submitter;
        uint256 timestamp;
        bool isValid;
        uint256 nftTokenId; // 0 if no NFT minted
    }
    
    struct ProofMetadata {
        string eventName;
        string eventDescription;
        string imageUri;
        string location;
        uint256 eventDate;
    }
    
    // Mapping from proof ID to commitment
    mapping(uint256 => ProofCommitment) public proofCommitments;
    
    // Mapping from commitment hash to proof ID
    mapping(bytes32 => uint256) public commitmentToProofId;
    
    // Mapping from eventId to proof metadata
    mapping(string => ProofMetadata) public eventMetadata;
    
    // Mapping from user address to their proof IDs
    mapping(address => uint256[]) public userProofs;
    
    // Mapping from eventId to list of proof IDs
    mapping(string => uint256[]) public eventProofs;
    
    // NFT base URI for metadata
    string private _baseTokenURI;
    
    event ProofSubmitted(
        uint256 indexed proofId,
        bytes32 indexed commitment,
        string eventId,
        address indexed submitter
    );
    
    event ProofValidated(
        uint256 indexed proofId,
        bool isValid
    );
    
    event NFTMinted(
        uint256 indexed tokenId,
        uint256 indexed proofId,
        address indexed recipient,
        string eventId
    );
    
    event EventMetadataSet(
        string indexed eventId,
        string eventName,
        string imageUri
    );
    
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) {
        _baseTokenURI = baseTokenURI;
    }
    
    /**
     * @dev Submit a ZK proof commitment
     * @param eventId The event identifier
     * @param proofData The ZK proof data (encoded)
     */
    function submitProof(
        string memory eventId,
        bytes memory proofData
    ) external nonReentrant returns (uint256) {
        require(bytes(eventId).length > 0, "Event ID cannot be empty");
        require(proofData.length > 0, "Proof data cannot be empty");
        
        // Create commitment hash
        bytes32 commitment = keccak256(
            abi.encodePacked(eventId, proofData, msg.sender, block.timestamp)
        );
        
        // Ensure this commitment hasn't been submitted before
        require(commitmentToProofId[commitment] == 0, "Proof already submitted");
        
        _proofCounter.increment();
        uint256 proofId = _proofCounter.current();
        
        // Store proof commitment
        proofCommitments[proofId] = ProofCommitment({
            commitment: commitment,
            eventId: eventId,
            submitter: msg.sender,
            timestamp: block.timestamp,
            isValid: true, // Auto-validate for demo (in production, this would be verified)
            nftTokenId: 0
        });
        
        // Update mappings
        commitmentToProofId[commitment] = proofId;
        userProofs[msg.sender].push(proofId);
        eventProofs[eventId].push(proofId);
        
        emit ProofSubmitted(proofId, commitment, eventId, msg.sender);
        
        // Auto-mint NFT for valid proof
        if (proofCommitments[proofId].isValid) {
            _mintNFT(proofId, msg.sender, eventId);
        }
        
        return proofId;
    }
    
    /**
     * @dev Internal function to mint NFT for valid proof
     */
    function _mintNFT(
        uint256 proofId,
        address recipient,
        string memory eventId
    ) internal {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        // Update proof with NFT token ID
        proofCommitments[proofId].nftTokenId = tokenId;
        
        // Mint NFT
        _safeMint(recipient, tokenId);
        
        // Set token URI based on event metadata
        ProofMetadata memory metadata = eventMetadata[eventId];
        if (bytes(metadata.imageUri).length > 0) {
            _setTokenURI(tokenId, metadata.imageUri);
        }
        
        emit NFTMinted(tokenId, proofId, recipient, eventId);
    }
    
    /**
     * @dev Set metadata for an event (only owner)
     */
    function setEventMetadata(
        string memory eventId,
        string memory eventName,
        string memory eventDescription,
        string memory imageUri,
        string memory location,
        uint256 eventDate
    ) external onlyOwner {
        eventMetadata[eventId] = ProofMetadata({
            eventName: eventName,
            eventDescription: eventDescription,
            imageUri: imageUri,
            location: location,
            eventDate: eventDate
        });
        
        emit EventMetadataSet(eventId, eventName, imageUri);
    }
    
    /**
     * @dev Manually validate/invalidate a proof (only owner)
     */
    function validateProof(uint256 proofId, bool isValid) external onlyOwner {
        require(proofId > 0 && proofId <= _proofCounter.current(), "Invalid proof ID");
        
        proofCommitments[proofId].isValid = isValid;
        emit ProofValidated(proofId, isValid);
        
        // Mint NFT if proof is now valid and no NFT exists
        if (isValid && proofCommitments[proofId].nftTokenId == 0) {
            _mintNFT(
                proofId,
                proofCommitments[proofId].submitter,
                proofCommitments[proofId].eventId
            );
        }
    }
    
    /**
     * @dev Get user's proof IDs
     */
    function getUserProofs(address user) external view returns (uint256[] memory) {
        return userProofs[user];
    }
    
    /**
     * @dev Get proofs for a specific event
     */
    function getEventProofs(string memory eventId) external view returns (uint256[] memory) {
        return eventProofs[eventId];
    }
    
    /**
     * @dev Get total number of proofs
     */
    function getTotalProofs() external view returns (uint256) {
        return _proofCounter.current();
    }
    
    /**
     * @dev Get total number of NFTs minted
     */
    function getTotalNFTs() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @dev Get proof details
     */
    function getProof(uint256 proofId) external view returns (
        bytes32 commitment,
        string memory eventId,
        address submitter,
        uint256 timestamp,
        bool isValid,
        uint256 nftTokenId
    ) {
        require(proofId > 0 && proofId <= _proofCounter.current(), "Invalid proof ID");
        
        ProofCommitment memory proof = proofCommitments[proofId];
        return (
            proof.commitment,
            proof.eventId,
            proof.submitter,
            proof.timestamp,
            proof.isValid,
            proof.nftTokenId
        );
    }
    
    /**
     * @dev Check if user has valid proof for event
     */
    function hasValidProofForEvent(address user, string memory eventId) 
        external view returns (bool) {
        uint256[] memory userProofIds = userProofs[user];
        
        for (uint256 i = 0; i < userProofIds.length; i++) {
            ProofCommitment memory proof = proofCommitments[userProofIds[i]];
            if (keccak256(bytes(proof.eventId)) == keccak256(bytes(eventId)) && proof.isValid) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Set base URI for NFT metadata
     */
    function setBaseURI(string memory baseTokenURI) external onlyOwner {
        _baseTokenURI = baseTokenURI;
    }
    
    /**
     * @dev Override required functions
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) 
        returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC721Enumerable) 
        returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}