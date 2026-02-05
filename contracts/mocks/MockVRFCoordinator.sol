// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockVRFCoordinator
 * @notice Mock Chainlink VRF Coordinator for local testing
 */
contract MockVRFCoordinator {
    uint256 public requestCounter;
    
    mapping(uint256 => address) public requests;

    event RandomWordsRequested(uint256 requestId, address consumer);

    function requestRandomWords(
        bytes32, // keyHash
        uint64,  // subId
        uint16,  // minimumRequestConfirmations
        uint32,  // callbackGasLimit
        uint32 numWords
    ) external returns (uint256 requestId) {
        requestCounter++;
        requestId = requestCounter;
        requests[requestId] = msg.sender;
        
        emit RandomWordsRequested(requestId, msg.sender);
        
        return requestId;
    }

    /**
     * @notice Manually fulfill random words for testing
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        address consumer = requests[requestId];
        require(consumer != address(0), "Request not found");
        
        // Call the consumer's fulfillRandomWords function
        (bool success,) = consumer.call(
            abi.encodeWithSignature(
                "rawFulfillRandomWords(uint256,uint256[])",
                requestId,
                randomWords
            )
        );
        require(success, "Callback failed");
    }

    /**
     * @notice Generate and fulfill with pseudo-random words
     */
    function fulfillRandomWordsWithSeed(uint256 requestId, uint256 seed) external {
        address consumer = requests[requestId];
        require(consumer != address(0), "Request not found");
        
        uint256[] memory randomWords = new uint256[](10);
        for (uint i = 0; i < 10; i++) {
            randomWords[i] = uint256(keccak256(abi.encodePacked(seed, i)));
        }
        
        (bool success,) = consumer.call(
            abi.encodeWithSignature(
                "rawFulfillRandomWords(uint256,uint256[])",
                requestId,
                randomWords
            )
        );
        require(success, "Callback failed");
    }
}
