import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import hre from "hardhat";
import { Wrapper, Wrapper__factory } from "../typechain";
import { contractConfig } from "../utils/config";
import { OwnableErrors, WrapperErrors } from "./errors";
import { setupWrapperContract } from "./setup";

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

  describe("constructor", function () {
    it("fail - uniswapRouterAddress is zero address", async function () {
      const uniswapRouterAddress = hre.ethers.constants.AddressZero;

      await expect(
        new Wrapper__factory(ownerWallet).deploy(contractConfig.name, contractConfig.symbol, uniswapRouterAddress),
      )
        .to.be.revertedWithCustomError(wrapperContract, WrapperErrors.INVALID_ADDRESS)
        .withArgs(uniswapRouterAddress);
    });

    it("success", async function () {
      const uniswapRouterAddress = hre.ethers.Wallet.createRandom().address;

      const wrapperContract = await new Wrapper__factory(ownerWallet).deploy(
        contractConfig.name,
        contractConfig.symbol,
        uniswapRouterAddress,
      );

      const name = await wrapperContract.name();
      expect(name).to.equal(contractConfig.name);

      const symbol = await wrapperContract.symbol();
      expect(symbol).to.equal(contractConfig.symbol);

      const uniswapRouterAddressAfter = await wrapperContract.getUniswapRouterAddress();
      expect(uniswapRouterAddressAfter).to.equal(uniswapRouterAddress);
    });
  });

  describe("setUniswapRouterAddress", function () {
    it("fail - not owner", async function () {
      const actionWallet = notOwnerWallet;
      const uniswapRouterAddress = hre.ethers.Wallet.createRandom().address;

      await expect(
        wrapperContract.connect(actionWallet).setUniswapRouterAddress(uniswapRouterAddress),
      ).to.be.revertedWith(OwnableErrors.OWNABLE_NOT_OWNER);
    });

    it("fail - uniswapRouterAddress is zero address", async function () {
      const actionWallet = ownerWallet;
      const uniswapRouterAddress = hre.ethers.constants.AddressZero;

      await expect(wrapperContract.connect(actionWallet).setUniswapRouterAddress(uniswapRouterAddress))
        .to.be.revertedWithCustomError(wrapperContract, WrapperErrors.INVALID_ADDRESS)
        .withArgs(uniswapRouterAddress);
    });

    it("success", async function () {
      const actionWallet = ownerWallet;
      const uniswapRouterAddress = hre.ethers.Wallet.createRandom().address;

      await expect(wrapperContract.connect(actionWallet).setUniswapRouterAddress(uniswapRouterAddress)).not.to.be
        .reverted;

      const uniswapRouterAddressAfter = await wrapperContract.getUniswapRouterAddress();
      expect(uniswapRouterAddressAfter).to.equal(uniswapRouterAddress);
    });
  });

  describe("getUniswapRouterAddress", function () {
    it("success", async function () {
      const uniswapRouterAddress = await wrapperContract.getUniswapRouterAddress();
      expect(uniswapRouterAddress).to.equal(contractConfig.uniswapRouterAddress);
    });
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
        OwnableErrors.OWNABLE_NOT_OWNER,
      );
    });

    it("fail - token address is zero address", async function () {
      const actionWallet = ownerWallet;
      const tokenAddress = hre.ethers.constants.AddressZero;

      await expect(wrapperContract.connect(actionWallet).addAllowedToken(tokenAddress))
        .to.be.revertedWithCustomError(wrapperContract, WrapperErrors.INVALID_ADDRESS)
        .withArgs(tokenAddress);
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
        OwnableErrors.OWNABLE_NOT_OWNER,
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
        OwnableErrors.OWNABLE_NOT_OWNER,
      );
    });

    it("fail - token address is zero address", async function () {
      const actionWallet = ownerWallet;
      const tokenAddresses = Array.from({ length: 25 }, () => hre.ethers.constants.AddressZero);

      await expect(wrapperContract.connect(actionWallet).addAllowedTokens(tokenAddresses))
        .to.be.revertedWithCustomError(wrapperContract, WrapperErrors.INVALID_ADDRESS)
        .withArgs(tokenAddresses[0]);
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
        OwnableErrors.OWNABLE_NOT_OWNER,
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
