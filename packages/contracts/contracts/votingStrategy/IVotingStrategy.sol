// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Defines the abstract contract for voting algorithms on grants
 * within a round. Any new voting algorithm would be expected to
 * extend this abstract contract.
 * Every IVotingStrategy implementation would ideally be deployed once per chain
 * and be invoked by the RoundImplementation contract
 *
 */
abstract contract IVotingStrategy {

   // --- Data ---

  /// @notice Round address
  address public roundAddress;


  // --- Core methods ---

  /**
   * @notice Invoked by RoundImplementation on creation to
   * set the round for which the voting contracts is to be used
   *
   */
  function init() external {
    require(roundAddress == address(0), "init: roundAddress already set");
    roundAddress = msg.sender;
  }

  /**
   * @notice Invoked by RoundImplementation to allow voter to case
   * vote for grants during a round.
   *
   * @dev
   * - allows contributor to do cast multiple votes which could be weighted.
   * - should be invoked by RoundImplementation contract
   * - ideally IVotingStrategy implementation should emit events after a vote is cast
   * - this would be triggered when a voter casts their vote via grant explorer
   *
   * @param _encodedVotes encoded votes
   * @param _voterAddress voter address
   */
  function vote(bytes[] calldata _encodedVotes, address _voterAddress) external virtual;
}
