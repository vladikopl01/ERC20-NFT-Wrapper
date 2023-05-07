import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Wrapper, Wrapper__factory } from "../typechain";
import { contractConfig } from "../utils/config";

export async function setupWrapperContract(ownerWallet: SignerWithAddress): Promise<Wrapper> {
  const wrapperContract = await new Wrapper__factory(ownerWallet).deploy(
    contractConfig.name,
    contractConfig.symbol,
    contractConfig.uniswapRouterAddress,
  );

  return wrapperContract;
}
