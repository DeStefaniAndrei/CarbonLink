const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Quick Chainlink Functions Test\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Testing with account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

    try {
        // Step 1: Deploy a simple test contract
        console.log("📦 Deploying test project contract...");
        const Project = await ethers.getContractFactory("ProjectImplementation");
        const projectContract = await Project.deploy();
        await projectContract.deployed();
        console.log("✅ Test contract deployed to:", projectContract.address);

        // Step 2: Initialize the contract
        console.log("\n⚙️ Initializing contract...");
        const FUNCTIONS_ROUTER = "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C";
        const DON_ID = "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000";
        const SUBSCRIPTION_ID = process.env.CHAINLINK_SUBSCRIPTION_ID || "5144";

        await projectContract.initialize(
            FUNCTIONS_ROUTER,
            1, // projectId
            deployer.address,
            "Test Forest - 50 acres of pine trees",
            Math.floor(Date.now() / 1000)
        );
        console.log("✅ Contract initialized");

        // Step 3: Set Chainlink configuration
        console.log("\n🔗 Setting Chainlink configuration...");
        const simpleSource = `
            // Simple test function
            const landDetails = args[0];
            console.log("Processing:", landDetails);
            
            // Simple calculation
            let carbonValue = 500; // Base value
            
            if (landDetails.includes("pine")) {
                carbonValue = 400;
            } else if (landDetails.includes("oak")) {
                carbonValue = 600;
            }
            
            console.log("Carbon value calculated:", carbonValue);
            return Functions.encodeUint256(carbonValue);
        `;

        await projectContract.setChainlinkConfig(
            DON_ID,
            SUBSCRIPTION_ID,
            simpleSource
        );
        console.log("✅ Chainlink configuration set");

        // Step 4: Test the request (this will cost LINK)
        console.log("\n🚀 Testing Chainlink Functions request...");
        console.log("⚠️  This will make a real request and cost LINK tokens!");
        console.log("Make sure your subscription is funded with LINK tokens.");
        
        const proceed = process.argv.includes("--proceed");
        if (!proceed) {
            console.log("\nTo proceed with the actual request, run:");
            console.log("npx hardhat run scripts/quick-test.js --network sepolia --proceed");
            console.log("\nOr set the --proceed flag to continue automatically.");
            return;
        }

        const tx = await projectContract.requestCarbonData();
        console.log("📤 Request transaction sent:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

        // Look for the event
        const event = receipt.events?.find(e => e.event === "CarbonDataRequested");
        if (event) {
            console.log("🎉 CarbonDataRequested event emitted!");
            console.log("Request ID:", event.args.requestId);
            console.log("\n📊 Next steps:");
            console.log("1. Check your subscription on https://functions.chain.link/sepolia");
            console.log("2. Monitor the request execution");
            console.log("3. Check if credits were issued after completion");
        } else {
            console.log("❌ CarbonDataRequested event not found in transaction");
        }

        // Save contract info
        const contractInfo = {
            network: "sepolia",
            testContract: projectContract.address,
            deployer: deployer.address,
            chainlink: {
                functionsRouter: FUNCTIONS_ROUTER,
                donId: DON_ID,
                subscriptionId: SUBSCRIPTION_ID
            },
            timestamp: new Date().toISOString()
        };

        console.log("\n📄 Contract info saved to quick-test-info.json");
        require("fs").writeFileSync(
            "./quick-test-info.json", 
            JSON.stringify(contractInfo, null, 2)
        );

    } catch (error) {
        console.error("❌ Test failed:", error.message);
        
        if (error.message.includes("Insufficient LINK")) {
            console.log("\n💡 Solution: Fund your Chainlink subscription with LINK tokens");
            console.log("Visit: https://functions.chain.link/sepolia");
        } else if (error.message.includes("Subscription not found")) {
            console.log("\n💡 Solution: Check your subscription ID in the .env file");
            console.log("Create a subscription at: https://functions.chain.link/sepolia");
        }
        
        process.exit(1);
    }
}

main().catch(console.error); 