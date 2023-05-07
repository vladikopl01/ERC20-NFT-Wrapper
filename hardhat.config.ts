import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-waffle";
import { HardhatUserConfig } from "hardhat/config";
import { envConfig } from "./utils/config";

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${envConfig.infuraApiKey}`,
      accounts: [envConfig.walletPrivateKey],
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  etherscan: {
    apiKey: envConfig.etherscanApiKey,
  },
  gasReporter: {
    enabled: envConfig.reportGas,
    coinmarketcap: envConfig.coinmarketcapApiKey,
    currency: "USD",
    showTimeSpent: true,
  },
};

export default config;
