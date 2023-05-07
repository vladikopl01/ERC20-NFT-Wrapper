// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

// Uncomment this line to use console.log
import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

error InvalidAddress(address address_);
error InvalidArrayLength(uint256 tokenAddressesLength_, uint256 tokenAmountsLength_);
error TokenNotAllowed(address tokenAddress_);
error InvalidTokenAmount(address tokenAddress_, uint256 amount_);
error NotApprovedOrOwner(address sender_, uint256 nftId_);

contract Wrapper is ERC721, Ownable {
    uint8 private _protocolFee;
    address private _uniswapRouterAddress;

    mapping(address => bool) private _allowedTokens;
    mapping(uint256 => address[]) private _nftToTokens;
    mapping(uint256 => mapping(address => uint256)) private _nftToTokenAmounts;

    constructor(string memory name, string memory symbol, address uniswapRouterAddress) ERC721(name, symbol) {
        if (uniswapRouterAddress == address(0)) revert InvalidAddress(uniswapRouterAddress);
        _uniswapRouterAddress = uniswapRouterAddress;
    }

    function mint(uint256 nftId, address[] calldata tokenAddresses, uint256[] calldata tokenAmounts) external {
        if (tokenAddresses.length != tokenAmounts.length)
            revert InvalidArrayLength(tokenAddresses.length, tokenAmounts.length);

        uint256 len = tokenAddresses.length;
        for (uint256 i = 0; i < len; ) {
            address tokenAddress = tokenAddresses[i];
            uint256 tokenAmount = tokenAmounts[i];

            if (!_allowedTokens[tokenAddress]) revert TokenNotAllowed(tokenAddress);
            if (tokenAmount == 0) revert InvalidTokenAmount(tokenAddress, tokenAmount);

            IERC20(tokenAddress).transferFrom(msg.sender, address(this), tokenAmount);
            _nftToTokenAmounts[nftId][tokenAddress] += tokenAmount;

            unchecked {
                ++i;
            }
        }

        _nftToTokens[nftId] = tokenAddresses;
        _safeMint(msg.sender, nftId);
    }

    function burn(uint256 nftId) external {
        if (!_isApprovedOrOwner(msg.sender, nftId)) revert NotApprovedOrOwner(msg.sender, nftId);

        address[] memory tokenAddresses = _nftToTokens[nftId];
        uint256 len = tokenAddresses.length;
        for (uint256 i = 0; i < len; ) {
            address tokenAddress = tokenAddresses[i];
            uint256 amount = (_nftToTokenAmounts[nftId][tokenAddress] * 995) / 1000;

            IERC20(tokenAddress).transferFrom(address(this), msg.sender, amount);

            unchecked {
                ++i;
            }
        }

        delete _nftToTokens[nftId];
        _burn(nftId);
    }

    function withdraw() external onlyOwner {}

    function setUniswapRouterAddress(address newAddress) external onlyOwner {
        if (newAddress == address(0)) revert InvalidAddress(newAddress);
        _uniswapRouterAddress = newAddress;
    }

    function getUniswapRouterAddress() external view returns (address) {
        return _uniswapRouterAddress;
    }

    function getTokenAllowance(address token) external view returns (bool) {
        return _allowedTokens[token];
    }

    function addAllowedToken(address token) external onlyOwner {
        if (token == address(0)) revert InvalidAddress(token);
        _allowedTokens[token] = true;
    }

    function removeAllowedToken(address token) external onlyOwner {
        delete _allowedTokens[token];
    }

    function addAllowedTokens(address[] calldata tokens) external onlyOwner {
        uint256 len = tokens.length;
        for (uint256 i = 0; i < len; ) {
            if (tokens[i] == address(0)) revert InvalidAddress(tokens[i]);
            _allowedTokens[tokens[i]] = true;

            unchecked {
                ++i;
            }
        }
    }

    function removeAllowedTokens(address[] calldata tokens) external onlyOwner {
        uint256 len = tokens.length;
        for (uint256 i = 0; i < len; ) {
            delete _allowedTokens[tokens[i]];

            unchecked {
                ++i;
            }
        }
    }
}
