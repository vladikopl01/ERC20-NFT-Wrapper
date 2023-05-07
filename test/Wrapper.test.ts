import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import hre from "hardhat";
import { Wrapper } from "../typechain";
import { setupWrapperContract } from "./setup";

enum ERRORS {
  OWNABLE_NOT_OWNER = "Ownable: caller is not the owner",
}

describe("Wrapper", function () {
  let wrapperContract: Wrapper;
  let ownerWallet: SignerWithAddress;
  let notOwnerWallet: SignerWithAddress;

  before(async function () {
    [ownerWallet, notOwnerWallet] = await hre.ethers.getSigners();
  });

  beforeEach(async function () {
    wrapperContract = await setupWrapperContract(ownerWallet);
  });

  describe("getTokenAllowance", function () {
    it("success", async function () {
      const tokenAddress = hre.ethers.Wallet.createRandom().address;

      const tokenState = await wrapperContract.getTokenAllowance(tokenAddress);
      expect(tokenState).to.equal(false);
    });
  });

  describe("addAllowedToken", function () {
    it("fail - not owner", async function () {
      const actionWallet = notOwnerWallet;
      const tokenAddress = hre.ethers.Wallet.createRandom().address;

      await expect(wrapperContract.connect(actionWallet).addAllowedToken(tokenAddress)).to.be.revertedWith(
        ERRORS.OWNABLE_NOT_OWNER,
      );
    });

    it("success", async function () {
      const actionWallet = ownerWallet;
      const tokenAddress = hre.ethers.Wallet.createRandom().address;

      await wrapperContract.connect(actionWallet).addAllowedToken(tokenAddress);

      const tokenStateAfter = await wrapperContract.getTokenAllowance(tokenAddress);
      expect(tokenStateAfter).to.equal(true);
    });
  });

  describe("removeAllowedToken", function () {
    it("fail - not owner", async function () {
      const actionWallet = notOwnerWallet;
      const tokenAddress = hre.ethers.Wallet.createRandom().address;

      await expect(wrapperContract.connect(actionWallet).removeAllowedToken(tokenAddress)).to.be.revertedWith(
        ERRORS.OWNABLE_NOT_OWNER,
      );
    });

    it("success", async function () {
      const actionWallet = ownerWallet;
      const tokenAddress = hre.ethers.Wallet.createRandom().address;

      await wrapperContract.connect(ownerWallet).addAllowedToken(tokenAddress);

      await expect(wrapperContract.connect(actionWallet).removeAllowedToken(tokenAddress)).not.to.be.reverted;

      const tokenStateAfter = await wrapperContract.getTokenAllowance(tokenAddress);
      expect(tokenStateAfter).to.equal(false);
    });
  });

  describe("addAllowedTokens", function () {
    it("fail - not owner", async function () {
      const actionWallet = notOwnerWallet;
      const tokenAddresses = Array.from({ length: 25 }, () => hre.ethers.Wallet.createRandom().address);

      await expect(wrapperContract.connect(actionWallet).addAllowedTokens(tokenAddresses)).to.be.revertedWith(
        ERRORS.OWNABLE_NOT_OWNER,
      );
    });

    it("success", async function () {
      const actionWallet = ownerWallet;
      const tokenAddresses = Array.from({ length: 25 }, () => hre.ethers.Wallet.createRandom().address);

      await expect(wrapperContract.connect(actionWallet).addAllowedTokens(tokenAddresses)).not.to.be.reverted;

      const tokenStatesAfter = await Promise.all(
        tokenAddresses.map(tokenAddress => wrapperContract.getTokenAllowance(tokenAddress)),
      );
      expect(tokenStatesAfter).to.deep.equal(Array.from({ length: 25 }, () => true));
    });
  });

  describe("removeAllowedTokens", function () {
    it("fail - not owner", async function () {
      const actionWallet = notOwnerWallet;
      const tokenAddresses = Array.from({ length: 25 }, () => hre.ethers.Wallet.createRandom().address);

      await expect(wrapperContract.connect(actionWallet).removeAllowedTokens(tokenAddresses)).to.be.revertedWith(
        ERRORS.OWNABLE_NOT_OWNER,
      );
    });

    it("success", async function () {
      const actionWallet = ownerWallet;
      const tokenAddresses = Array.from({ length: 25 }, () => hre.ethers.Wallet.createRandom().address);

      await wrapperContract.connect(ownerWallet).addAllowedTokens(tokenAddresses);

      await expect(wrapperContract.connect(actionWallet).removeAllowedTokens(tokenAddresses)).not.to.be.reverted;

      const tokenStatesAfter = await Promise.all(
        tokenAddresses.map(tokenAddress => wrapperContract.getTokenAllowance(tokenAddress)),
      );
      expect(tokenStatesAfter).to.deep.equal(Array.from({ length: 25 }, () => false));
    });
  });
});
