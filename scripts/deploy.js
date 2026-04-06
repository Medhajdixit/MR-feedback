const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🚀 Starting CampusFeedback+ 2.0 Core Contracts Deployment...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "SHM\n");

    const deployment = {
        network: (await ethers.provider.getNetwork()).name,
        chainId: Number((await ethers.provider.getNetwork()).chainId),
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {},
    };

    console.log("⛓️  Network:", deployment.network);
    console.log("🔗 Chain ID:", deployment.chainId);
    console.log("\n" + "=".repeat(70) + "\n");

    // Step 1: Deploy PrivacyContract
    console.log("📦 Deploying PrivacyContract...");
    const PrivacyContract = await ethers.getContractFactory("PrivacyContract");
    const privacyContract = await PrivacyContract.deploy();
    await privacyContract.waitForDeployment();
    const privacyAddress = await privacyContract.getAddress();
    deployment.contracts.PrivacyContract = privacyAddress;
    console.log("✅ PrivacyContract deployed to:", privacyAddress);

    // Step 2: Deploy StudentRegistryContract
    console.log("\n📦 Deploying StudentRegistryContract...");
    const StudentRegistryContract = await ethers.getContractFactory("StudentRegistryContract");
    const studentRegistry = await StudentRegistryContract.deploy(privacyAddress);
    await studentRegistry.waitForDeployment();
    const registryAddress = await studentRegistry.getAddress();
    deployment.contracts.StudentRegistryContract = registryAddress;
    console.log("✅ StudentRegistryContract deployed to:", registryAddress);

    // Step 3: Deploy AIModerationContract
    console.log("\n📦 Deploying AIModerationContract...");
    const AIModerationContract = await ethers.getContractFactory("AIModerationContract");
    const aiModeration = await AIModerationContract.deploy();
    await aiModeration.waitForDeployment();
    const moderationAddress = await aiModeration.getAddress();
    deployment.contracts.AIModerationContract = moderationAddress;
    console.log("✅ AIModerationContract deployed to:", moderationAddress);

    // Step 4: Deploy FeedbackContract
    console.log("\n📦 Deploying FeedbackContract...");
    const FeedbackContract = await ethers.getContractFactory("FeedbackContract");
    const feedback = await FeedbackContract.deploy(
        registryAddress,
        moderationAddress,
        privacyAddress
    );
    await feedback.waitForDeployment();
    const feedbackAddress = await feedback.getAddress();
    deployment.contracts.FeedbackContract = feedbackAddress;
    console.log("✅ FeedbackContract deployed to:", feedbackAddress);

    // Step 5: Deploy PointEconomyContract
    console.log("\n📦 Deploying PointEconomyContract...");
    const PointEconomyContract = await ethers.getContractFactory("PointEconomyContract");
    const pointEconomy = await PointEconomyContract.deploy(registryAddress);
    await pointEconomy.waitForDeployment();
    const pointsAddress = await pointEconomy.getAddress();
    deployment.contracts.PointEconomyContract = pointsAddress;
    console.log("✅ PointEconomyContract deployed to:", pointsAddress);

    // Step 6: Deploy RatingContract
    console.log("\n📦 Deploying RatingContract...");
    const RatingContract = await ethers.getContractFactory("RatingContract");
    const rating = await RatingContract.deploy(registryAddress, moderationAddress);
    await rating.waitForDeployment();
    const ratingAddress = await rating.getAddress();
    deployment.contracts.RatingContract = ratingAddress;
    console.log("✅ RatingContract deployed to:", ratingAddress);

    console.log("\n" + "=".repeat(70) + "\n");

    // Grant roles
    console.log("🔐 Configuring contract roles...\n");

    // Grant AI Service role to deployer (for testing)
    console.log("  Granting AI_SERVICE_ROLE to deployer...");
    await aiModeration.grantAIServiceRole(deployer.address);
    console.log("  ✅ AI_SERVICE_ROLE granted");

    // Grant REWARD_MANAGER_ROLE to FeedbackContract
    console.log("  Granting REWARD_MANAGER_ROLE to FeedbackContract...");
    await pointEconomy.grantRewardManagerRole(feedbackAddress);
    console.log("  ✅ REWARD_MANAGER_ROLE granted");

    // Grant MODERATOR_ROLE to deployer (for testing)
    console.log("  Granting MODERATOR_ROLE to deployer...");
    await feedback.grantModeratorRole(deployer.address);
    await rating.grantModeratorRole(deployer.address);
    console.log("  ✅ MODERATOR_ROLE granted");

    console.log("\n" + "=".repeat(70) + "\n");

    // Save deployment info
    const deploymentPath = "./deployment.json";
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    console.log("💾 Deployment info saved to:", deploymentPath);

    // Display summary
    console.log("\n" + "=".repeat(70));
    console.log("\n🎉 Core Contracts Deployment Complete!\n");
    console.log("📋 Deployed Contracts:");
    console.log("   1. PrivacyContract:          ", privacyAddress);
    console.log("   2. StudentRegistryContract:  ", registryAddress);
    console.log("   3. AIModerationContract:     ", moderationAddress);
    console.log("   4. FeedbackContract:         ", feedbackAddress);
    console.log("   5. PointEconomyContract:     ", pointsAddress);
    console.log("   6. RatingContract:           ", ratingAddress);
    console.log("\n💡 Next Steps:");
    console.log("   - Verify contracts on block explorer");
    console.log("   - Fund PointEconomyContract with SHM for redemptions");
    console.log("   - Configure AI service backend with contract addresses");
    console.log("   - Proceed to Phase 3: AI Moderation System");
    console.log("\n" + "=".repeat(70) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
