const { network } = require("hardhat");
const { developmentChains, DECIMAl, ANSWER } = require("../helper");
module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();


    if (developmentChains.includes(network.name)) {
        log("deploying mock contract-----------------------")

        await deploy("VRFCoordinatorV2Mock", {
            contract: "VRFCoordinatorV2Mock",
            from: deployer,
            log: true,
            //waitConfirmations: network.config.blockConfirmations,
            args: [DECIMAl, ANSWER]
        })

        log("----------Mocks Deployed---------------")
        log("--------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
