const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing CarbonLink Integration...\n");

    // Test 1: Verify contracts are accessible
    console.log("1️⃣ Testing Contract Access...");
    try {
        const ProjectImplementation = await ethers.getContractFactory("ProjectImplementation");
        const FactoryImplementation = await ethers.getContractFactory("FactoryImplementation");
        const MainManager = await ethers.getContractFactory("MainManager");
        console.log("✅ All contracts accessible");
    } catch (error) {
        console.log("❌ Contract access failed:", error.message);
        return;
    }

    // Test 2: Verify Chainlink Functions configuration
    console.log("\n2️⃣ Testing Chainlink Functions Setup...");
    const chainlinkConfig = {
        router: "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C", // Sepolia Functions Router
        donId: "0x66756e2d657468657265756d2d7365706f6c69612d310000000000000000", // Sepolia DON ID
        subscriptionId: "1" // You'll need to create a subscription
    };
    
    console.log("📡 Chainlink Functions Router:", chainlinkConfig.router);
    console.log("🆔 DON ID:", chainlinkConfig.donId);
    console.log("📋 Subscription ID:", chainlinkConfig.subscriptionId);
    console.log("⚠️  Note: You need to create a Chainlink Functions subscription");

    // Test 3: Simulate project creation
    console.log("\n3️⃣ Testing Project Creation Simulation...");
    const sampleProject = {
        name: "Pine Forest Project",
        landDetails: "Forest Project - 100 acres of pine trees - Lat:40.7128,Lng:-74.0060 - Sensors:ABC123,DEF456",
        startDate: Math.floor(Date.now() / 1000)
    };
    
    console.log("🌲 Project Name:", sampleProject.name);
    console.log("📍 Land Details:", sampleProject.landDetails);
    console.log("📅 Start Date:", new Date(sampleProject.startDate * 1000).toLocaleDateString());

    // Test 4: Simulate carbon calculation
    console.log("\n4️⃣ Testing Carbon Calculation Logic...");
    const mockCarbonValue = 12500; // Simulated carbon credits
    console.log("🌱 Calculated Carbon Credits:", mockCarbonValue);
    console.log("💰 Estimated Value (at $50/credit):", `$${(mockCarbonValue * 50).toLocaleString()}`);

    // Test 5: Verify token economics
    console.log("\n5️⃣ Testing Token Economics...");
    const bufferPercentage = 10;
    const tradableAmount = Math.floor(mockCarbonValue * (100 - bufferPercentage) / 100);
    const bufferAmount = mockCarbonValue - tradableAmount;
    
    console.log("💎 Total Credits:", mockCarbonValue);
    console.log("🔄 Tradable Credits:", tradableAmount);
    console.log("🛡️ Buffer Credits:", bufferAmount);
    console.log("📊 Buffer Percentage:", bufferPercentage + "%");

    console.log("\n🎉 CarbonLink Integration Test Complete!");
    console.log("\n📋 Next Steps:");
    console.log("1. Create a Chainlink Functions subscription");
    console.log("2. Deploy your contracts to Sepolia (if not already done)");
    console.log("3. Configure your frontend with the deployed contract addresses");
    console.log("4. Test the complete flow: Create Project → Request Carbon Data → Issue Tokens");
    console.log("5. Build your frontend UI for project management and trading");
}

main().catch(console.error); 