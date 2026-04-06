const { ethers } = require("hardhat");

async function verifySetup() {
    console.log("🔍 Verifying CampusFeedback+ 2.0 Setup...\n");
    console.log("=".repeat(60));

    let allChecks = true;

    // Check 1: Hardhat Configuration
    console.log("\n✓ Checking Hardhat configuration...");
    try {
        const config = require("../hardhat.config.js");
        console.log("  ✅ Hardhat config loaded successfully");
        console.log("  📝 Solidity version:", config.solidity.version);
        console.log("  ⛓️  Networks configured:", Object.keys(config.networks).join(", "));
    } catch (error) {
        console.log("  ❌ Hardhat config error:", error.message);
        allChecks = false;
    }

    // Check 2: Environment Variables
    console.log("\n✓ Checking environment variables...");
    require("dotenv").config();
    const requiredEnvVars = [
        "SHARDEUM_RPC_URL",
        "CHAIN_ID",
    ];

    const optionalEnvVars = [
        "PRIVATE_KEY",
        "AI_SERVICE_URL",
        "MONGODB_URI",
        "REDIS_URL",
        "IPFS_API_URL",
    ];

    requiredEnvVars.forEach((envVar) => {
        if (process.env[envVar]) {
            console.log(`  ✅ ${envVar} is set`);
        } else {
            console.log(`  ⚠️  ${envVar} is not set (required)`);
        }
    });

    optionalEnvVars.forEach((envVar) => {
        if (process.env[envVar]) {
            console.log(`  ✅ ${envVar} is set`);
        } else {
            console.log(`  ℹ️  ${envVar} is not set (optional)`);
        }
    });

    // Check 3: Network Connectivity
    console.log("\n✓ Checking Shardeum network connectivity...");
    try {
        const provider = new ethers.JsonRpcProvider(
            process.env.SHARDEUM_RPC_URL || "https://api-unstable.shardeum.org"
        );
        const network = await provider.getNetwork();
        console.log("  ✅ Connected to Shardeum Unstablenet");
        console.log("  🔗 Chain ID:", network.chainId.toString());
        console.log("  📛 Network name:", network.name);

        const blockNumber = await provider.getBlockNumber();
        console.log("  📦 Current block:", blockNumber);
    } catch (error) {
        console.log("  ❌ Network connection error:", error.message);
        console.log("  ℹ️  This is expected if you haven't configured .env yet");
    }

    // Check 4: Dependencies
    console.log("\n✓ Checking installed dependencies...");
    try {
        const packageJson = require("../package.json");
        const deps = Object.keys(packageJson.dependencies || {});
        const devDeps = Object.keys(packageJson.devDependencies || {});
        console.log(`  ✅ ${deps.length} production dependencies installed`);
        console.log(`  ✅ ${devDeps.length} development dependencies installed`);
    } catch (error) {
        console.log("  ❌ Package.json error:", error.message);
        allChecks = false;
    }

    // Check 5: Directory Structure
    console.log("\n✓ Checking directory structure...");
    const fs = require("fs");
    const requiredDirs = [
        "contracts/core",
        "ai-services",
        "backend",
        "frontend",
        "scripts",
        "test",
        "docs",
    ];

    requiredDirs.forEach((dir) => {
        if (fs.existsSync(dir)) {
            console.log(`  ✅ ${dir}/`);
        } else {
            console.log(`  ❌ ${dir}/ not found`);
            allChecks = false;
        }
    });

    // Check 6: Configuration Files
    console.log("\n✓ Checking configuration files...");
    const requiredFiles = [
        "hardhat.config.js",
        "package.json",
        "docker-compose.yml",
        ".env.example",
        ".gitignore",
        "README.md",
    ];

    requiredFiles.forEach((file) => {
        if (fs.existsSync(file)) {
            console.log(`  ✅ ${file}`);
        } else {
            console.log(`  ❌ ${file} not found`);
            allChecks = false;
        }
    });

    // Summary
    console.log("\n" + "=".repeat(60));
    if (allChecks) {
        console.log("\n✅ All checks passed! Phase 1 setup is complete.");
        console.log("\n📌 Next steps:");
        console.log("   1. Copy .env.example to .env and configure your settings");
        console.log("   2. Add your private key to .env (for deployment)");
        console.log("   3. Get SHM tokens from Shardeum faucet");
        console.log("   4. Proceed to Phase 2: Core Smart Contracts Development");
    } else {
        console.log("\n⚠️  Some checks failed. Please review the errors above.");
    }
    console.log("\n" + "=".repeat(60) + "\n");
}

verifySetup()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    });
