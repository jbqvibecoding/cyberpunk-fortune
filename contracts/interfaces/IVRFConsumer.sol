// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IVRFConsumer
 * @notice Interface for Chainlink VRF v2 consumer contracts
 */
interface IVRFConsumer {
    function requestRandomWords() external returns (uint256 requestId);
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external;
}
