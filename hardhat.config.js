require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: true,
        },
    },
    networks: {
        hardhat: {
            chainId: 1337,
        },
        shardeumUnstable: {
            url: process.env.SHARDEUM_RPC_URL || "https://api-unstable.shardeum.org",
            chainId: 8080,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: "auto",
            gas: "auto",
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 1337,
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    mocha: {
        timeout: 40000,
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS === "true",
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
    },
    etherscan: {
        apiKey: {
            shardeumUnstable: "no-api-key-needed",
        },
        customChains: [
            {
                network: "shardeumUnstable",
                chainId: 8080,
                urls: {
                    apiURL: "https://explorer-unstable.shardeum.org/api",
                    browserURL: "https://explorer-unstable.shardeum.org",
                },
            },
        ],
    },
};
