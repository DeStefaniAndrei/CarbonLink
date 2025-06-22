const { expect } = require("chai");
const {
    time,
    //loadFixture allows to use a function before it statements, so avoids repeating setup code
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("MyToken contract", function() {

    async function deployFunction(){

        // Contracts are deployed using the first account by default
        const [owner] = await ethers.getSigners();

        const MyToken = await ethers.getContractFactory("MyToken");
        const myToken = await MyToken.deploy(1000);
        return { myToken, owner }
    }

    it("Deployment should assign the total supply of tokens to the owner", async function() {

        const {myToken, owner} = await loadFixture(deployFunction)
        const ownerBalance = await myToken.balanceOf(owner.address);
        expect(await myToken.totalSupply()).to.equal(ownerBalance);

        expect(await myToken.name()).to.equal("MyToken");
        expect(await myToken.symbol()).to.equal("MTK");
    });
});