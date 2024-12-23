// SPDX-License-Identifier: MIT
// Tells the Solidity compiler to compile only from v0.8.13 to v0.9.0
pragma solidity ^0.8.13;

contract Dao {
    // Struct
    struct Proposal {
        uint id;
        string name;
        uint amount;
        address payable recipient;
        uint votes;
        uint end;
        bool executed;
    }

    // Mappings
    mapping(address => bool) public investors;
    mapping(address => uint) public shares;
    mapping(uint => Proposal) public proposals;
    mapping(address => mapping(uint => bool)) public votes;
    //

    // Variables
    uint public availabeFunds;
    uint public totalShares;
    uint public contributionEnd;
    uint public nextProposalId;
    uint public voteTime;
    uint public quorum;
    address public admin;

    //

    constructor(uint contributionTime, uint _voteTime, uint _quorum) {
        require(_quorum > 0 && _quorum < 100, "quorum is not a valid number");
        contributionEnd = block.timestamp + contributionTime;
        voteTime = _voteTime;
        quorum = _quorum;
        admin = msg.sender;
    }

    /**
@dev this function contribute and add inverstors && change shares, availableFund).
*/
    function contribute() external payable {
        require(
            block.timestamp < contributionEnd,
            "contribution time has ended with contributionEnd"
        );
        investors[msg.sender] = true;
        shares[msg.sender] += msg.value;
        totalShares += msg.value;
        availabeFunds += msg.value;
    }

    /**
@dev this function redeems the share that investors has invested.
*/
    function redeemShare(uint amount) external {
        require(shares[msg.sender] >= amount, "not enough shares");
        require(availabeFunds >= amount, "not enough availableFund");

        shares[msg.sender] -= amount;
        availabeFunds -= amount;
        payable(msg.sender).transfer(amount);
    }

    /**
@dev this function is transfering the shares.
*/
    function tranferShare(uint amount, address to) external {
        require(shares[msg.sender] >= amount, "not enough share");

        shares[msg.sender] -= amount;
        shares[to] += amount;
        investors[to] = true;
    }

    /**
@dev this function creates the proposals 
*/
    function createProposal(
        string memory name,
        uint amount,
        address payable recipient
    ) external onlyInvestors {
        require(availabeFunds >= amount, "the amount is too big");

        proposals[nextProposalId] = Proposal(
            nextProposalId,
            name,
            amount,
            recipient,
            0,
            block.timestamp + voteTime,
            false
        );
        availabeFunds -= amount;
        nextProposalId++;
    }

    /**
@dev this function is allow to vote or for voting
*/
    function vote(uint proposalId) external onlyInvestors {
        Proposal storage proposal = proposals[proposalId];

        require(
            votes[msg.sender][proposalId] == false,
            "you can vote only once"
        );
        require(block.timestamp < proposal.end, "the proposal time has ended");

        // allow voter to vote ( prevent double voting )
        votes[msg.sender][proposalId] = true;
        proposal.votes += shares[msg.sender];
    }

    /**
@dev this function is executing the proposals
*/
    function executeProposal(uint proposalId) external onlyAdmin {
        Proposal storage proposal = proposals[proposalId];

        require(
            block.timestamp >= proposal.end,
            "cannot execute when time isn't ended"
        );
        require(
            proposal.executed == false,
            "cannot execute the proposal that already executed"
        );
        // complex the shares to execute
        require(
            (proposal.votes * 100) / totalShares >= quorum,
            "votes are not enough to execute"
        );

        proposal.executed = true; // Mark as executed
        _transferEther(proposal.amount, proposal.recipient);
    }

    /**
@dev these functions are transfering!
*/
    function withdrawEther(uint amount, address payable to) external onlyAdmin {
        _transferEther(amount, to);
    }

    receive() external payable {
        availabeFunds += msg.value;
    }

    function _transferEther(uint amount, address payable to) internal {
        require(amount <= availabeFunds, "not enough availablefunds");
        availabeFunds -= amount;
        payable(to).transfer(amount);
    }

    /**
@dev modifiers
*/
    modifier onlyInvestors() {
        require(investors[msg.sender] == true, "only investors");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin");
        _;
    }
}
