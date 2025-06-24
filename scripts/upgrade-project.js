const { ethers, upgrades } = require("hardhat");

// No beacon address yet since we don't need to use this file yet. Only if we need to upgrade the contracts
async function upgradeProject() {
    const BEACON_ADDRESS = "YOUR_BEACON_ADDRESS";

    // Deploy new implementation
    const CarbonProjectV2 = await ethers.getContractFactory("CarbonProjectV2");

    // Upgrade all project instances through beacon
    await upgrades.upgradeBeacon(BEACON_ADDRESS, CarbonProjectV2);
    console.log("All project instances upgraded to V2");
}