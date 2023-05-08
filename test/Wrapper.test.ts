import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import hre from "hardhat";
import { abi as ERC20ABI } from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import { Wrapper, Wrapper__factory } from "../typechain";
import { IERC20 } from "../typechain/@openzeppelin/contracts/token/ERC20/IERC20";
import { contractConfig } from "../utils/config";
import { OwnableErrors, WrapperErrors } from "./errors";
import { setupWrapperContract } from "./setup";

describe("Wrapper", function () {
  let wrapperContract: Wrapper;
  let ownerWallet: SignerWithAddress;
  let notOwnerWallet: SignerWithAddress;

  let mockERC20Contract: MockContract<IERC20>;

  before(async function () {
    [ownerWallet, notOwnerWallet] = await hre.ethers.getSigners();
  });

  beforeEach(async function () {
    wrapperContract = await setupWrapperContract(ownerWallet);
    mockERC20Contract = await deployMockContract(ownerWallet, ERC20ABI);
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

  describe("mint", function () {
    it("fail - invalid array length", async function () {
      const actionWallet = notOwnerWallet;
      const nftId = 1;
      const tokenAddresses = [hre.ethers.Wallet.createRandom().address];
      const tokenAmounts = [1, 2];

      await expect(wrapperContract.connect(actionWallet).mint(nftId, tokenAddresses, tokenAmounts))
        .to.be.revertedWithCustomError(wrapperContract, WrapperErrors.INVALID_ARRAY_LENGTH)
        .withArgs(tokenAddresses.length, tokenAmounts.length);
    });

    it("fail - token not allowed", async function () {
      const actionWallet = notOwnerWallet;
      const nftId = 1;
      const tokenAddresses = [hre.ethers.Wallet.createRandom().address];
      const tokenAmounts = [1];

      await expect(wrapperContract.connect(actionWallet).mint(nftId, tokenAddresses, tokenAmounts))
        .to.be.revertedWithCustomError(wrapperContract, WrapperErrors.TOKEN_NOT_ALLOWED)
        .withArgs(tokenAddresses[0]);
    });

    it("fail - invalid token amount", async function () {
      const actionWallet = notOwnerWallet;
      const nftId = 1;
      const tokenAddresses = [hre.ethers.Wallet.createRandom().address];
      const tokenAmounts = [0];

      await wrapperContract.connect(ownerWallet).addAllowedToken(tokenAddresses[0]);

      await expect(wrapperContract.connect(actionWallet).mint(nftId, tokenAddresses, tokenAmounts))
        .to.be.revertedWithCustomError(wrapperContract, WrapperErrors.INVALID_TOKEN_AMOUNT)
        .withArgs(tokenAddresses[0], tokenAmounts[0]);
    });

    it("success", async function () {
      const actionWallet = notOwnerWallet;
      const nftId = 1;
      const tokenAddresses = [hre.ethers.Wallet.createRandom().address];
      const tokenAmounts = [1];

      await wrapperContract.connect(ownerWallet).addAllowedToken(tokenAddresses[0]);

      await expect(wrapperContract.connect(actionWallet).mint(nftId, tokenAddresses, tokenAmounts)).not.to.be.reverted;

      const nftOwner = await wrapperContract.ownerOf(nftId);
      expect(nftOwner).to.equal(actionWallet.address);
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
