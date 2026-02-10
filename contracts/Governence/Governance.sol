// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

contract Governance is
    GovernorVotesQuorumFraction,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes
{
    constructor(IVotes _token)
        Governor("CyberpunkFortune Governance")
        GovernorSettings(
            1,           // votingDelay: 1 block
            45818,       // votingPeriod: ~1 week (12s/block)
            0            // proposalThreshold: 0 tokens
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // 4% quorum
    {}

    // 解决多重继承冲突：显式指定使用 GovernorVotesQuorumFraction 的版本
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(Governor, GovernorVotes)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // 显式 override propose（避免继承链歧义）
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

    // 可选：override 其他冲突函数（如 cancel、_execute 等）
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