const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper")
const { verify } = require("../utils/verify");
module.exports = async ({ deployments, getNamedAccounts }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = await network.config.chainId;
    let address, subscriptionId
    const SUB_ID = 0
    const SUBSCRIPTION_AMOUNT = ethers.utils.parseEther("4")
    if (developmentChains.includes(network.name)) {
        const VRFCooordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        address = VRFCooordinatorV2Mock.address
        const transactionResponse = await VRFCooordinatorV2Mock.createSubscription()
        const transactionReciept = await transactionResponse.wait()
        subscriptionId = transactionReciept.events[0].args.subId
    } else {
        address = networkConfig[chainId]["VRFCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }
    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callBackGasLimit = networkConfig[chainId]["callBackGasLimit"]
    const interval = networkConfig[chainId]["interval"]

    const args = [address, entranceFee, gasLane, subscriptionId, callBackGasLimit, interval]
    const lottery = await deploy("Lottery", {
        contract: "Lottery",
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfirmations
    })
    log("_______________________Deployed_________________")
    if (!developmentChains.includes(network.name)) {
        verify(lottery.address, args)
        log("________________________________________________")
    }
}

module.exports.tags = ["all", "lottery"]