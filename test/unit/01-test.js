
const { assert, expect } = require("chai")
const { ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper")
describe("Testing hardhat lottery smart contract", async function () {
    let deployer, accounts
    let lottery, VRFCoordinatorV2
    let chainId
    let entryAmount
    const extraAmount = ethers.utils.parseEther("1")
    beforeEach(async function () {
        accounts = await ethers.getSigners();
        deployer = accounts[0]
        await deployments.fixture(["all"])
        chainId = network.config.chainId
        lottery = await ethers.getContract("Lottery", deployer)
        VRFCoordinatorV2 = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        entryAmount = await lottery.getEntranceFee();

    })
    it("Lottery state", async function () {
        const responce = await lottery.getRaffleState();
        assert.equal(responce.toString(), "0")
    })

    it("Interval", async function () {
        const interval = await lottery.getInterval();
        assert.equal(interval.toString(), networkConfig[chainId]["interval"])
    })

    describe("Enter raffle", async () => {
        it("Should revert the transaction if not enough value", async () => {
            await expect(lottery.enterRaffle()).to.be.revertedWith("Lottery__NotEnoughamount")
        })
        it("should be able to enter the raffle", async () => {
            await lottery.enterRaffle({ value: entryAmount })
            const deployerAddress = await deployer.address;
            const playerAddress = await lottery.getPlayers(0)
            assert.equal(deployerAddress, playerAddress)
        })

        it("should be reverted with lottery state error", async () => {
            await lottery.changeLotteryState()
            await expect(lottery.enterRaffle({ value: entryAmount })).to.be.revertedWith("Lottery__lotteryStateNotOpen")
        })

        it("should be reverted with extra amount error", async () => {
            await lottery.changeLotteryState()
            await expect(lottery.enterRaffle({ value: extraAmount })).to.be.revertedWith("Lottery__ExtraAmount")
        })

        it("should emit an event", async () => {
            await expect(lottery.enterRaffle({ value: entryAmount })).to.emit
                (lottery, "raffleEnter")
        })
    })

})