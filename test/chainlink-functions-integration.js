const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Chainlink Functions Integration", function () {
    let projectContract;
    let managerContract;
    let deployer;
    let user;

    // Chainlink Functions configuration for Sepolia
    const FUNCTIONS_ROUTER = "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C";
    const DON_ID = "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000";
    
    // You'll need to replace this with your actual subscription ID
    const SUBSCRIPTION_ID = process.env.CHAINLINK_SUBSCRIPTION_ID || "5144";

    beforeEach(async function () {
        [deployer, user] = await ethers.getSigners();

        // Deploy a test project implementation
        const Project = await ethers.getContractFactory("ProjectImplementation");
        projectContract = await Project.deploy();

        // Initialize the project
        await projectContract.initialize(
            FUNCTIONS_ROUTER,
            1, // projectId
            user.address,
            "Test Forest Project - 100 acres of pine trees",
            Math.floor(Date.now() / 1000) // startDate
        );

        // Set Chainlink configuration
        await projectContract.setChainlinkConfig(
            DON_ID,
            SUBSCRIPTION_ID,
            getTestSourceCode()
        );
    });

    function getTestSourceCode() {
        return `
            // Simple test function that simulates carbon credit calculation
            // In production, this would analyze satellite/IoT data
            
            const landDetails = args[0];
            
            // Simulate AI analysis of forest data
            // This is where you'd integrate with actual AI models
            let carbonValue = 0;
            
            if (landDetails.includes("pine trees")) {
                carbonValue = 1500; // 1500 credits for pine forest
            } else if (landDetails.includes("oak trees")) {
                carbonValue = 2000; // 2000 credits for oak forest
            } else {
                carbonValue = 1000; // Default value
            }
            
            // Add some randomness to simulate real-world variation
            const variation = Math.floor(Math.random() * 200) - 100;
            carbonValue = Math.max(0, carbonValue + variation);
            
            return Functions.encodeUint256(carbonValue);
        `;
    }

    it("Should configure Chainlink Functions properly", async function () {
        expect(await projectContract.functionsRouter()).to.equal(FUNCTIONS_ROUTER);
        expect(await projectContract.donId()).to.equal(DON_ID);
        expect(await projectContract.subscriptionId()).to.equal(SUBSCRIPTION_ID);
        expect(await projectContract.source()).to.not.equal("");
    });

    it("Should emit CarbonDataRequested event when requesting data", async function () {
        // Only project owner can request data
        await projectContract.connect(user).requestCarbonData();
        
        // Note: In a real test, you'd need to wait for the Chainlink Functions
        // to execute and call the fulfillRequest function
        // This test just verifies the request was made
    });

    it("Should handle fulfillRequest callback correctly", async function () {
        const testCarbonValue = 1500;
        const encodedValue = ethers.utils.defaultAbiCoder.encode(["uint256"], [testCarbonValue]);
        
        // Simulate Chainlink Functions callback
        await projectContract.fulfillRequest(
            ethers.utils.hexZeroPad("0x1", 32), // mock requestId
            encodedValue,
            "0x" // no error
        );
        
        // Check that credits were issued
        expect(await projectContract.totalCreditsIssued()).to.equal(testCarbonValue);
        expect(await projectContract.bufferCredits()).to.equal(testCarbonValue * 10 / 100); // 10% buffer
    });

    it("Should handle buffer pool correctly", async function () {
        const testCarbonValue = 2000;
        const encodedValue = ethers.utils.defaultAbiCoder.encode(["uint256"], [testCarbonValue]);
        
        // Issue credits first
        await projectContract.fulfillRequest(
            ethers.utils.hexZeroPad("0x1", 32),
            encodedValue,
            "0x"
        );
        
        const initialBuffer = await projectContract.bufferCredits();
        expect(initialBuffer).to.equal(200); // 10% of 2000
        
        // Use buffer for reversal
        await projectContract.connect(user).handleReversal(50);
        expect(await projectContract.bufferCredits()).to.equal(150);
    });
}); 