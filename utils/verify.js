const { run } = require("hardhat");

async function verify(contractAddress, args) { //args will be the constructor of a smart contract
    console.log("Verifying Contract---------");
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })

    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Contract Already Verified")
        }
        else {
            console.log(e);
        }

    }
}
module.exports = {
    verify
}