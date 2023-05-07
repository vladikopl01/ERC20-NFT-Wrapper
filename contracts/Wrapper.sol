// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

// Uncomment this line to use console.log
import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error InvalidAddress(address address_);

contract Wrapper is ERC721, Ownable {
    uint8 private _protocolFee;
    address private _uniswapRouterAddress;

    mapping(address => bool) private _allowedTokens;
    mapping(uint256 => address[]) private _nftToTokens;

    constructor(string memory name, string memory symbol, address uniswapRouterAddress) ERC721(name, symbol) {
        if (uniswapRouterAddress == address(0)) revert InvalidAddress(uniswapRouterAddress);
        _uniswapRouterAddress = uniswapRouterAddress;
    }

    function mint() external {}

    function burn() external {}

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
