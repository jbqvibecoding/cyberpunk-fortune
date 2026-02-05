// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockFunctionsRouter
 * @notice Mock Chainlink Functions Router for local testing
 */
contract MockFunctionsRouter {
    uint256 public requestCounter;
    
    mapping(bytes32 => address) public requests;

    event OracleRequest(bytes32 requestId, address consumer);

    function sendRequest(
        uint64,     // subscriptionId
        bytes calldata, // data
        uint16,     // dataVersion
        uint32,     // callbackGasLimit
        bytes32     // donId
    ) external returns (bytes32 requestId) {
        requestCounter++;
        requestId = bytes32(requestCounter);
        requests[requestId] = msg.sender;
        
        emit OracleRequest(requestId, msg.sender);
        
        return requestId;
    }

    /**
     * @notice Manually fulfill request for testing
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) external {
        address consumer = requests[requestId];
        require(consumer != address(0), "Request not found");
        
        (bool success,) = consumer.call(
            abi.encodeWithSignature(
                "handleOracleFulfillment(bytes32,bytes,bytes)",
                requestId,
                response,
                err
            )
        );
        require(success, "Callback failed");
    }
}
