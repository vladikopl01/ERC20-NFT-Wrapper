import * as dotenv from "dotenv";
import * as env from "env-var";

dotenv.config({ path: ".env" });

export const envConfig = {
  infuraApiKey: env.get("INFURA_API_KEY").required(false).asString(),
  etherscanApiKey: env.get("ETHERSCAN_API_KEY").required(false).asString(),
  walletPrivateKey: env.get("WALLET_PRIVATE_KEY").required(false).asString(),
  coinmarketcapApiKey: env.get("COINMARKETCAP_API_KEY").required(false).asString(),
  reportGas: env.get("REPORT_GAS").required(false).asBool(),
};

export const contractConfig = {
  name: env.get("TOKEN_NAME").default("Wrapped NFT").asString(),
  symbol: env.get("TOKEN_SYMBOL").default("WNFT").asString(),
  uniswapRouterAddress: env
    .get("UNISWAP_ROUTER_ADDRESS")
    .default("0xE592427A0AEce92De3Edee1F18E0157C05861564")
    .asString(),
};
