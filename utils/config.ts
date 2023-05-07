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
