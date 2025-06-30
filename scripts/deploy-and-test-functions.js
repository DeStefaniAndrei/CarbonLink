const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🚀 Deploying CarbonLink with Chainlink Functions Integration...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying from:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

    // Chainlink Functions configuration for Sepolia
    const FUNCTIONS_ROUTER = "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C";
    const DON_ID = "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000";
    
    // You need to create a subscription on https://functions.chain.link/sepolia
    // and replace this with your actual subscription ID
    const SUBSCRIPTION_ID = process.env.CHAINLINK_SUBSCRIPTION_ID || "5144";

    try {
        // Step 1: Deploy Project Implementation
        console.log("📦 Deploying Project Implementation...");
        const CarbonProject = await ethers.getContractFactory("ProjectImplementation");
        const projectImplementation = await CarbonProject.deploy();
        await projectImplementation.deployed();
        console.log("✅ Project Implementation deployed to:", projectImplementation.address);

        // Step 2: Deploy Beacon
        console.log("\n🏗️ Deploying Beacon...");
        const beacon = await upgrades.deployBeacon(CarbonProject);
        await beacon.deployed();
        console.log("✅ Beacon deployed to:", await beacon.getAddress());

        // Step 3: Deploy Factory
        console.log("\n🏭 Deploying Factory...");
        const Factory = await ethers.getContractFactory("FactoryImplementation");
        const factory = await upgrades.deployProxy(Factory, [await beacon.getAddress()], {
            initializer: "initialize"
        });
        await factory.deployed();
        console.log("✅ Factory deployed to:", await factory.getAddress());

        // Step 4: Deploy Manager
        console.log("\n👨‍💼 Deploying Main Manager...");
        const Manager = await ethers.getContractFactory("MainManager");
        const manager = await upgrades.deployProxy(Manager, [
            await factory.getAddress(),
            await beacon.getAddress()
        ], {
            initializer: "initialize"
        });
        await manager.deployed();
        console.log("✅ Manager deployed to:", await manager.getAddress());

        // Step 5: Configure Global Chainlink Settings
        console.log("\n🔗 Configuring Chainlink Functions...");
        
        // Read the source code
        const sourceCode = fs.readFileSync("./scripts/chainlink-functions-source.js", "utf8");
        
        await manager.setGlobalChainlinkConfig(
            DON_ID,
            SUBSCRIPTION_ID,
            sourceCode
        );
        console.log("✅ Global Chainlink configuration set");

        // Step 6: Create a Test Project
        console.log("\n🌲 Creating Test Project...");
        const testLandDetails = "Forest Project - 100 acres of pine trees - Lat:40.7128,Lng:-74.0060 - Sensors:ABC123,DEF456";
        
        const createProjectTx = await manager.createProject(testLandDetails);
        const createProjectReceipt = await createProjectTx.wait();
        
        // Get the project address from the factory
        const projectAddress = await factory.getProject(1); // projectId = 1
        console.log("✅ Test project created at:", projectAddress);

        // Step 7: Configure the Project
        console.log("\n⚙️ Configuring Test Project...");
        const projectContract = await ethers.getContractAt("ProjectImplementation", projectAddress);
        
        await projectContract.setChainlinkConfig(
            DON_ID,
            SUBSCRIPTION_ID,
            sourceCode
        );
        console.log("✅ Project Chainlink configuration set");

        // Step 8: Test Chainlink Functions Request
        console.log("\n🧪 Testing Chainlink Functions Request...");
        console.log("Note: This will make a real request to Chainlink Functions");
        console.log("Make sure you have LINK tokens in your subscription!");
        
        const requestTx = await projectContract.requestCarbonData();
        const requestReceipt = await requestTx.wait();
        
        // Look for the CarbonDataRequested event
        const event = requestReceipt.events.find(e => e.event === "CarbonDataRequested");
        if (event) {
            console.log("✅ Carbon data request sent! Request ID:", event.args.requestId);
            console.log("⏳ Waiting for Chainlink Functions to process...");
            console.log("Check your subscription dashboard for execution status");
        }

        // Save deployment info
        const deploymentInfo = {
            network: "sepolia",
            deployer: deployer.address,
            contracts: {
                projectImplementation: projectImplementation.address,
                beacon: await beacon.getAddress(),
                factory: await factory.getAddress(),
                manager: await manager.getAddress(),
                testProject: projectAddress
            },
            chainlink: {
                functionsRouter: FUNCTIONS_ROUTER,
                donId: DON_ID,
                subscriptionId: SUBSCRIPTION_ID
            },
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync("./deployment-info.json", JSON.stringify(deploymentInfo, null, 2));
        console.log("\n📄 Deployment info saved to deployment-info.json");

        console.log("\n🎉 Deployment Complete!");
        console.log("\n📋 Next Steps:");
        console.log("1. Fund your Chainlink subscription with LINK tokens");
        console.log("2. Monitor the request on https://functions.chain.link/sepolia");
        console.log("3. Check the project contract for issued credits");
        console.log("4. Test the frontend integration");

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

main().catch(console.error); 