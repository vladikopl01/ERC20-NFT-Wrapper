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
    // USDC token address
    address private constant _USDC_ADDRESS = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;

    // Protocol fee in percents
    uint8 private _protocolFee;
    // Uniswap router address
    address private _uniswapRouterAddress;

    // Mapping for allowed tokens to be wrapped
    mapping(address => bool) private _allowedTokens;

    // Mapping for NFT's tokens which are wrapped
    mapping(uint256 => address[]) private _nftToTokens;
    // Mapping for NFT's tokens amounts which are wrapped
    mapping(uint256 => uint256[]) private _nftToTokenAmounts;

    // Array for NFT's ids
    uint256[] private _nftIds;
    // Mapping for NFT's id to index in array _nftIds
    mapping(uint256 => uint256) private _nftIdToIndex;

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
        _addTokenToEnumeration(nftId);
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
        _removeTokenFromEnumeration(nftId);
        _burn(nftId);
    }

    function withdraw() external onlyOwner {
        uint256 len = _nftIds.length;
        for (uint256 i = 0; i < len; ) {
            uint256 nftId = _nftIds[i];
            address[] memory tokenAddresses = _nftToTokens[nftId];
            uint256[] memory tokenAmounts = _nftToTokenAmounts[nftId];

            uint256 tokenAddressesLen = tokenAddresses.length;
            for (uint256 j = 0; j < tokenAddressesLen; ) {
                address tokenAddress = tokenAddresses[j];
                uint256 tokenAmount = tokenAmounts[j];

                uint256 amount = (tokenAmount * _protocolFee) / 1000;

                address[] memory path = new address[](3);
                path[0] = tokenAddress;
                path[1] = ISwapRouter(_uniswapRouterAddress).WETH9();
                path[2] = _USDC_ADDRESS;

                IERC20(tokenAddress).approve(_uniswapRouterAddress, amount);

                ISwapRouter(_uniswapRouterAddress).exactInputSingle(
                    ISwapRouter.ExactInputSingleParams({
                        tokenIn: tokenAddress,
                        tokenOut: _USDC_ADDRESS,
                        fee: 3000,
                        recipient: address(this),
                        deadline: block.timestamp,
                        amountIn: amount,
                        amountOutMinimum: 0,
                        sqrtPriceLimitX96: 0
                    })
                );

                IERC20(_USDC_ADDRESS).transferFrom(
                    address(this),
                    owner(),
                    IERC20(_USDC_ADDRESS).balanceOf(address(this))
                );

                unchecked {
                    ++j;
                }
            }

            unchecked {
                ++i;
            }
        }
    }

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

    function _addTokenToEnumeration(uint256 nftId) private {
        _nftIdToIndex[nftId] = _nftIds.length;
        _nftIds.push(nftId);
    }

    function _removeTokenFromEnumeration(uint256 nftId) private {
        // Removing nft from array by swapping it with the last nft in the array

        // Get the last nft index in the array
        uint256 lastTokenIndex = _nftIds.length - 1;
        // Get the nft index to be removed in the array
        uint256 tokenIndex = _nftIdToIndex[nftId];

        // Get the last nft id in the array
        uint256 lastTokenId = _nftIds[lastTokenIndex];

        // Swap the last nft id with the nft id to be removed
        _nftIds[tokenIndex] = lastTokenId;
        _nftIdToIndex[lastTokenId] = tokenIndex;

        // Delete the last nft in the array and its index
        _nftIds.pop();
        delete _nftIdToIndex[nftId];
    }
}
