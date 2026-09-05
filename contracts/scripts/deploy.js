const hre = require("hardhat");
const path = require("path");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // ─── Step 1: Deploy ReputationBadge ────────────────────────────────────────
  console.log("\n[1/5] Deploying ReputationBadge...");
  const ReputationBadge = await hre.ethers.getContractFactory("ReputationBadge");
  const reputationBadge = await ReputationBadge.deploy();
  await reputationBadge.waitForDeployment();
  const badgeAddress = await reputationBadge.getAddress();
  console.log("  ReputationBadge deployed to:", badgeAddress);

  // ─── Step 2: Deploy GigEscrow ───────────────────────────────────────────────
  console.log("\n[2/5] Deploying GigEscrow...");
  // Using deployer as arbitrator initially. For gasless meta-tx,
  // we use deployer as the trusted forwarder (for local dev — use a real forwarder in prod)
  const GigEscrow = await hre.ethers.getContractFactory("GigEscrow");
  const gigEscrow = await GigEscrow.deploy(deployer.address, hre.ethers.ZeroAddress);
  await gigEscrow.waitForDeployment();
  const escrowAddress = await gigEscrow.getAddress();
  console.log("  GigEscrow deployed to:", escrowAddress);

  // ─── Step 3: Wire ReputationBadge → GigEscrow ──────────────────────────────
  console.log("\n[3/5] Setting GigEscrow address on ReputationBadge...");
  const tx3 = await reputationBadge.setGigEscrowAddress(escrowAddress);
  await tx3.wait();
  console.log("  Done.");

  // ─── Step 4: Wire GigEscrow → ReputationBadge ──────────────────────────────
  console.log("\n[4/5] Setting ReputationBadge address on GigEscrow...");
  const tx4 = await gigEscrow.setReputationBadgeContract(badgeAddress);
  await tx4.wait();
  console.log("  Done.");

  // ─── Step 5: Activate badge minting ────────────────────────────────────────
  console.log("\n[5/5] Activating badge minting on GigEscrow...");
  const tx5 = await gigEscrow.toggleBadges(true);
  await tx5.wait();
  console.log("  Done.");

  // ─── Save addresses to frontend ────────────────────────────────────────────
  const addresses = {
    GigEscrow: escrowAddress,
    ReputationBadge: badgeAddress,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const frontendLibPath = path.join(__dirname, "../../frontend/src/lib");
  if (!fs.existsSync(frontendLibPath)) {
    fs.mkdirSync(frontendLibPath, { recursive: true });
  }
  fs.writeFileSync(
    path.join(frontendLibPath, "addresses.json"),
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n✅ Addresses saved to frontend/src/lib/addresses.json");
  console.log("\n════════ Deployment Complete ════════");
  console.log("GigEscrow:       ", escrowAddress);
  console.log("ReputationBadge: ", badgeAddress);
  console.log("Network:         ", hre.network.name);
  console.log("Arbitrator:      ", deployer.address);
  console.log("═════════════════════════════════════\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
