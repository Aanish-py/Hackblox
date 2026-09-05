const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GigEscrow + ReputationBadge", function () {
  let escrow, badge;
  let owner, client, freelancer, arbitrator, other;

  before(async function () {
    [owner, client, freelancer, arbitrator, other] = await ethers.getSigners();

    // Deploy ReputationBadge
    const Badge = await ethers.getContractFactory("ReputationBadge");
    badge = await Badge.deploy();
    await badge.waitForDeployment();

    // Deploy GigEscrow (owner = arbitrator, trusted forwarder = owner for tests)
    const Escrow = await ethers.getContractFactory("GigEscrow");
    escrow = await Escrow.deploy(arbitrator.address, owner.address);
    await escrow.waitForDeployment();

    // Wire contracts
    await badge.setGigEscrowAddress(await escrow.getAddress());
    await escrow.connect(arbitrator).setReputationBadgeContract(await badge.getAddress());
    await escrow.connect(arbitrator).toggleBadges(true);
  });

  // ── Helper ──────────────────────────────────────────────────────
  async function postGigETH(gigClient = client) {
    const descriptions = ["Design mockup", "Frontend implementation"];
    const values = [ethers.parseEther("0.5"), ethers.parseEther("0.5")];
    const total = ethers.parseEther("1.0");

    const tx = await escrow.connect(gigClient).postGig(
      ethers.ZeroAddress,
      "ipfs://QmTestCID123",
      descriptions,
      values,
      { value: total }
    );
    const receipt = await tx.wait();
    const gigId = await escrow.gigCount();
    return { gigId, total };
  }

  // ══════════════════════════════════════════════════════════════
  // SECTION 1: Posting Gigs
  // ══════════════════════════════════════════════════════════════
  describe("postGig()", function () {
    it("should create a gig and lock ETH", async function () {
      const { gigId, total } = await postGigETH();

      const gig = await escrow.gigs(gigId);
      expect(gig.client).to.equal(client.address);
      expect(gig.totalBudget).to.equal(total);
      expect(gig.state).to.equal(0); // Open

      // Contract should hold the ETH
      const balance = await ethers.provider.getBalance(await escrow.getAddress());
      expect(balance).to.equal(total);
    });

    it("should revert if ETH sent doesn't match milestone sum", async function () {
      await expect(
        escrow.connect(client).postGig(
          ethers.ZeroAddress,
          "test",
          ["Milestone 1"],
          [ethers.parseEther("1.0")],
          { value: ethers.parseEther("0.5") }
        )
      ).to.be.revertedWith("GigEscrow: ETH sent must equal total budget");
    });

    it("should revert if milestones exceed 10", async function () {
      const descs = Array(11).fill("desc");
      const vals = Array(11).fill(ethers.parseEther("0.1"));
      const total = ethers.parseEther("1.1");

      await expect(
        escrow.connect(client).postGig(ethers.ZeroAddress, "test", descs, vals, { value: total })
      ).to.be.revertedWith("GigEscrow: Must have 1-10 milestones");
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SECTION 2: Bidding & Freelancer Selection
  // ══════════════════════════════════════════════════════════════
  describe("bidGig() + selectFreelancer()", function () {
    let gigId;

    before(async function () {
      const res = await postGigETH();
      gigId = res.gigId;
    });

    it("should allow freelancer to bid", async function () {
      await escrow.connect(freelancer).bidGig(gigId);
      expect(await escrow.hasBid(gigId, freelancer.address)).to.be.true;
    });

    it("should prevent client from bidding on own gig", async function () {
      await expect(escrow.connect(client).bidGig(gigId)).to.be.revertedWith(
        "GigEscrow: Client cannot bid on own gig"
      );
    });

    it("should allow client to select freelancer", async function () {
      await escrow.connect(client).selectFreelancer(gigId, freelancer.address);
      const gig = await escrow.gigs(gigId);
      expect(gig.freelancer).to.equal(freelancer.address);
      expect(gig.state).to.equal(1); // InProgress
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SECTION 3: Milestone Release
  // ══════════════════════════════════════════════════════════════
  describe("releaseMilestonePayment()", function () {
    let gigId;
    const milestoneValue = ethers.parseEther("0.5");

    before(async function () {
      const res = await postGigETH();
      gigId = res.gigId;
      await escrow.connect(freelancer).bidGig(gigId);
      await escrow.connect(client).selectFreelancer(gigId, freelancer.address);
    });

    it("should pay freelancer on milestone release", async function () {
      const balanceBefore = await ethers.provider.getBalance(freelancer.address);
      await escrow.connect(client).releaseMilestonePayment(gigId, 0);
      const balanceAfter = await ethers.provider.getBalance(freelancer.address);

      expect(balanceAfter - balanceBefore).to.be.closeTo(
        milestoneValue,
        ethers.parseEther("0.01") // gas tolerance
      );
    });

    it("should mark gig Complete after all milestones released", async function () {
      await escrow.connect(client).releaseMilestonePayment(gigId, 1);
      const gig = await escrow.gigs(gigId);
      expect(gig.state).to.equal(2); // Completed
    });

    it("should update reputation counters on completion", async function () {
      const completed = await escrow.completedGigs(freelancer.address);
      expect(completed).to.be.gte(1n);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SECTION 4: Dispute Flow
  // ══════════════════════════════════════════════════════════════
  describe("raiseDispute() + submitDisputeResolution()", function () {
    let gigId;

    before(async function () {
      const res = await postGigETH();
      gigId = res.gigId;
      await escrow.connect(freelancer).bidGig(gigId);
      await escrow.connect(client).selectFreelancer(gigId, freelancer.address);
    });

    it("should allow client to raise a dispute", async function () {
      await escrow.connect(client).raiseDispute(gigId, "Deliverable does not meet requirements");
      const gig = await escrow.gigs(gigId);
      expect(gig.state).to.equal(3); // Disputed
    });

    it("should reset freelancer streak on dispute", async function () {
      const streak = await escrow.currentStreak(freelancer.address);
      expect(streak).to.equal(0n);
    });

    it("should allow arbitrator to resolve in freelancer's favor", async function () {
      const balanceBefore = await ethers.provider.getBalance(freelancer.address);
      await escrow.connect(arbitrator).submitDisputeResolution(gigId, true, "0x");
      const balanceAfter = await ethers.provider.getBalance(freelancer.address);
      expect(balanceAfter).to.be.gt(balanceBefore);

      const gig = await escrow.gigs(gigId);
      expect(gig.state).to.equal(2); // Completed
    });

    it("should allow arbitrator to resolve in client's favor (refund)", async function () {
      const res = await postGigETH();
      const gId = res.gigId;
      await escrow.connect(freelancer).bidGig(gId);
      await escrow.connect(client).selectFreelancer(gId, freelancer.address);
      await escrow.connect(freelancer).raiseDispute(gId, "Client unresponsive");

      const clientBalanceBefore = await ethers.provider.getBalance(client.address);
      await escrow.connect(arbitrator).submitDisputeResolution(gId, false, "0x");
      const clientBalanceAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalanceAfter).to.be.gt(clientBalanceBefore);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SECTION 5: Cancel Gig
  // ══════════════════════════════════════════════════════════════
  describe("cancelGigByClient()", function () {
    it("should refund client on cancellation of Open gig", async function () {
      const { gigId, total } = await postGigETH();
      const balanceBefore = await ethers.provider.getBalance(client.address);
      const tx = await escrow.connect(client).cancelGigByClient(gigId);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(client.address);
      expect(balanceAfter + gasUsed - balanceBefore).to.be.closeTo(total, ethers.parseEther("0.001"));
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SECTION 6: Access Control
  // ══════════════════════════════════════════════════════════════
  describe("Access Control", function () {
    let gigId;

    before(async function () {
      const res = await postGigETH();
      gigId = res.gigId;
      await escrow.connect(freelancer).bidGig(gigId);
      await escrow.connect(client).selectFreelancer(gigId, freelancer.address);
    });

    it("should prevent non-client from releasing milestones", async function () {
      await expect(
        escrow.connect(other).releaseMilestonePayment(gigId, 0)
      ).to.be.revertedWith("GigEscrow: Not the client");
    });

    it("should prevent non-arbitrator from resolving disputes", async function () {
      await escrow.connect(client).raiseDispute(gigId, "test");
      await expect(
        escrow.connect(other).submitDisputeResolution(gigId, true, "0x")
      ).to.be.revertedWith("GigEscrow: Not the arbitrator");
    });
  });

  // ══════════════════════════════════════════════════════════════
  // SECTION 7: ReputationBadge
  // ══════════════════════════════════════════════════════════════
  describe("ReputationBadge", function () {
    it("should prevent non-GigEscrow from minting badges", async function () {
      await expect(
        badge.connect(other).mintBadge(freelancer.address, 0, 5)
      ).to.be.revertedWith("ReputationBadge: Caller is not GigEscrow");
    });

    it("should allow owner to grant special badge", async function () {
      await badge.connect(owner).grantSpecialBadge(freelancer.address, "https://example.com/badge");
      const userBadges = await badge.getUserBadges(freelancer.address);
      expect(userBadges.length).to.be.gte(1);
    });
  });
});
