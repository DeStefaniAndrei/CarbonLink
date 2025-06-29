const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("Deploying CarbonLink Upgradeable Factory System...");

    // Deploy project implementation
    const CarbonProject = await ethers.getContractFactory("ProjectImplementation");
    console.log("Deploying project implementation...");

    // Deploy beacon with project implementation
    const beacon = await upgrades.deployBeacon(CarbonProject);
    await beacon.deployed();
    console.log("Beacon deployed to:", beacon.address);

    // Deploy factory implementation
    const Factory = await ethers.getContractFactory("FactoryImplementation");
    console.log("Deploying factory...");

    const factory = await upgrades.deployProxy(Factory, [beacon.address], {
        initializer: "initialize"
    });
    await factory.deployed();
    console.log("Factory deployed to:", factory.address);

    // Deploy manager
    const Manager = await ethers.getContractFactory("MainManager");
    const manager = await upgrades.deployProxy(Manager, [
        factory.address,
        beacon.address
    ], {
        initializer: "initialize"
    });
    await manager.deployed();
    console.log("Manager deployed to:", manager.address);

    console.log("\n✅ Deployment Summary:");
    console.log("Beacon:", beacon.address);
    console.log("Factory:", factory.address);
    console.log("Manager:", manager.address);

    return {
        beacon: beacon.address,
        factory: factory.address,
        manager: manager.address
    };
}

main().catch(console.error);
