const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Chainlink Functions Integration", function () {
    let projectContract;
    let deployer;

    beforeEach(async function () {
        [deployer] = await ethers.getSigners();

        // Deploy your ProjectImplementation contract
        const Project = await ethers.getContractFactory("ProjectImplementation");
        projectContract = await Project.deploy();

        // Configure with your actual subscription details
        await projectContract.setChainlinkConfig(
            "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000", // Sepolia DON ID
            5144, // Your subscription ID
            "return Functions.encodeUint256(1000);" // Simple test source
        );
    });

    it("Should make a successful Functions request", async function () {
        const tx = await projectContract.requestCarbonData();
        const receipt = await tx.wait();

        // Check that request was emitted
        expect(receipt.events.some(e => e.event === "CarbonDataRequested")).to.be.true;
    });
});