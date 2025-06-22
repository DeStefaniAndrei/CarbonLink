require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.10",
                settings: { optimizer: { enabled: true, runs: 200 } }
            },
            {
                version: "0.8.19",
                networks: {
                    sepolia: {
                        url: process.env.SEPOLIA_RPC_URL || "",
                        accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
                    }
                },
                settings: { optimizer: { enabled: true, runs: 200 } }
            },
            {
                version: "0.8.20",
                settings: { optimizer: { enabled: true, runs: 200 } }
            }
        ]
    },
    networks: {
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL || "",
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
        }
    }
};