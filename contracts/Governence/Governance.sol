// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

contract Governance is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    constructor(IVotes _token)
        Governor("CyberpunkFortune Governance")
        GovernorSettings(
            1,           // votingDelay
            45818,       // votingPeriod
            0            // proposalThreshold
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)
    {}

    /**
     * @dev Supports interface for both Governor and GovernorVotes
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(Governor, GovernorVotes)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Propose function override to handle conflicts
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    )
        public
        virtual
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.propose(targets, values, calldatas, description);
    }

    /**
     * @dev Cancel function override to handle conflicts
     */
    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    )
        public
        virtual
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.cancel(targets, values, calldatas, descriptionHash);
    }
}