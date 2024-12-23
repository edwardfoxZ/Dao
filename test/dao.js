const Dao = artifacts.require("Dao");
const { expectRevert, time } = require("@openzeppelin/test-helpers");

contract("Dao", (accounts) => {
  let dao = null;
  const [admin, investor1, investor2, investor3] = [
    accounts[0],
    accounts[1],
    accounts[2],
    accounts[3],
  ];

  before(async () => {
    dao = await Dao.new(2, 2, 50);
  });

  it("Should accept contribution", async () => {
    await dao.contribute({ from: investor1, value: 1000 });
    await dao.contribute({ from: investor2, value: 2000 });
    await dao.contribute({ from: investor3, value: 3000 });

    const share1 = await dao.shares(investor1);
    const share2 = await dao.shares(investor2);
    const share3 = await dao.shares(investor3);
    const isInvested1 = await dao.investors(investor1);
    const isInvested2 = await dao.investors(investor2);
    const isInvested3 = await dao.investors(investor3);
    const totalShares = await dao.totalShares();
    const availableFunds = await dao.availabeFunds();

    assert(share1.toNumber() === 1000);
    assert(share2.toNumber() === 2000);
    assert(share3.toNumber() === 3000);
    assert(isInvested1 === true);
    assert(isInvested2 === true);
    assert(isInvested3 === true);
    assert(totalShares.toNumber() === 6000);
    assert(availableFunds.toNumber() === 6000);
  });

  it("Should NOT accept contribution after contributionTime", async () => {
    await time.increase(2001);
    await expectRevert(
      dao.contribute({ from: investor1, value: 1000 }),
      "contribution time has ended with contributionEnd"
    );
  });

  it("Should create Proposal", async () => {
    await dao.createProposal("Proposal1", 100, accounts[8], { from: investor1 });
    const proposal = await dao.proposals(0);

    assert(proposal.name === "Proposal1");
    assert(proposal.amount.toNumber() === 100);
    assert(proposal.recipient === accounts[8]);
    assert(proposal.votes.toNumber() === 0);
    assert(proposal.executed === false);
  });

  it("Should NOT create Proposal if sender isn't investor", async () => {
    await expectRevert(
      dao.createProposal("Proposal2", 100, accounts[8], { from: accounts[8] }),
      "only investors"
    );
  });

  it("Should NOT create Proposal when amount is too big", async () => {
    await expectRevert(
      dao.createProposal("Proposal2", 10000, accounts[8], { from: investor1 }),
      "the amount is too big"
    );
  });

  it("Should vote", async () => {
    await dao.vote(0, { from: investor1 });
  });

  it("Should NOT vote when non-investor", async () => {
    await expectRevert(dao.vote(0, { from: accounts[8] }), "only investors");
  });

  it("Should NOT vote when someone already voted", async () => {
    await expectRevert(
      dao.vote(0, { from: investor1 }),
      "you can vote only once"
    );
  });

  it("Should NOT vote after proposal end", async () => {
    await time.increase(2001);
    await expectRevert(
      dao.vote(0, { from: investor2 }),
      "the proposal time has ended"
    );
  });

  it("Should execute Proposal", async () => {
    await dao.createProposal("Proposal2", 100, accounts[8], { from: investor1 });
    await dao.vote(1, { from: investor1 });
    await dao.vote(1, { from: investor2 });
    await dao.vote(1, { from: investor3 });
    await time.increase(2001);
    await dao.executeProposal(1);
  });

  it("Should NOT execute the proposal already executed", async () => {
    await expectRevert(
      dao.executeProposal(1),
      "cannot execute the proposal that already executed"
    );
  });

  it("Should NOT execute when votes are not enough to execute", async () => {
    await dao.createProposal("Proposal3", 100, accounts[8], { from: investor1 });
    await dao.vote(2, { from: investor1 });
    await time.increase(2001);

    await expectRevert(
      dao.executeProposal(2),
      "votes are not enough to execute"
    );
  });

  it("Should withdraw", async () => {
    const balanceBefore = await web3.eth.getBalance(accounts[8]);
    await dao.withdrawEther(100, accounts[8], { from: admin });
    const balanceAfter = await web3.eth.getBalance(accounts[8]);
    const beforeBN = web3.utils.toBN(balanceBefore);
    const afterBN = web3.utils.toBN(balanceAfter);

    assert(afterBN.sub(beforeBN).toNumber() === 100);
  });

  it("Should NOT withdraw if non-admin", async () => {
    await expectRevert(
      dao.withdrawEther(100, accounts[8], { from: investor1 }),
      "only admin"
    );
  });

  it("Should NOT transfer Ether if amount is higher than available funds", async () => {
    await expectRevert(
      dao.withdrawEther(10000, accounts[8], { from: admin }),
      "not enough availablefunds"
    );
  });
});
