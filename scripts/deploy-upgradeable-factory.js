const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("Deploying CarbonLink Upgradeable Factory System...");

    // Deploy project implementation
    const CarbonProject = await ethers.getContractFactory("ProjectImplementation");
    console.log("Deploying project implementation...");

    // Deploy beacon with project implementation
    const beacon = await upgrades.deployBeacon(CarbonProject);
    await beacon.waitForDeployment();
    console.log("Beacon deployed to:", await beacon.getAddress());

    // Deploy factory implementation
    const Factory = await ethers.getContractFactory("FactoryImplementation");
    console.log("Deploying factory...");

    const factory = await upgrades.deployProxy(Factory, [await beacon.getAddress()], {
        initializer: "initialize"
    });
    await factory.waitForDeployment();
    console.log("Factory deployed to:", await factory.getAddress());

    // Deploy manager
    const Manager = await ethers.getContractFactory("MainManager");
    const manager = await upgrades.deployProxy(Manager, [
        await factory.getAddress(),
        await beacon.getAddress()
    ], {
        initializer: "initialize"
    });
    await manager.waitForDeployment();
    console.log("Manager deployed to:", await manager.getAddress());

    console.log("\n✅ Deployment Summary:");
    console.log("Beacon:", await beacon.getAddress());
    console.log("Factory:", await factory.getAddress());
    console.log("Manager:", await manager.getAddress());

    return {
        beacon: await beacon.getAddress(),
        factory: await factory.getAddress(),
        manager: await manager.getAddress()
    };
}

main().catch(console.error);
