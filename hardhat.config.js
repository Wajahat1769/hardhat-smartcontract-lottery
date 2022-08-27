require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
//require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const RINKEBY_URL = process.env.RINKEBY_URL || "https://"
const RINKEBY_ACCOUNT = process.env.ACCOUNT_KEY || "advsvdvr"
const ETHERSCAN_APIKEY = process.env.ETHERSCAN_API_KEY || "qwdsdw"
const CMC_APIKEY = process.env.CMC_API_KEY || "sascwd"

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {

  solidity: {
    compilers: [{ version: "0.6.9" }, { version: "0.8.9" }]
  },
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1
    },
    rinkeby: {
      chainId: 4,
      blockConfirmations: 6,
      url: RINKEBY_URL,
      accounts: [RINKEBY_ACCOUNT]
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337
    }

  },
  namedAccounts: {
    deployer: {
      default: 0
    },
    player: {
      default: 1
    },
  }
};
