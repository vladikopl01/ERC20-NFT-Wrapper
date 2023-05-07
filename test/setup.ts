import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Wrapper, Wrapper__factory } from "../typechain";

export async function setupWrapperContract(ownerWallet: SignerWithAddress): Promise<Wrapper> {
  const wrapperFactory = new Wrapper__factory(ownerWallet);
  const wrapperContract = await wrapperFactory.deploy();

  return wrapperContract;
}
