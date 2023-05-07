// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

// Uncomment this line to use console.log
import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Wrapper is ERC721, Ownable {
    mapping(address => bool) private _allowedTokens;

    constructor() ERC721("Wrapped Token", "WTKN") {}

    function mint() external {}

    function burn() external {}

    function withdraw() external onlyOwner {}

    function getTokenAllowance(address token) external view returns (bool) {
        return _allowedTokens[token];
    }

    function addAllowedToken(address token) external onlyOwner {
        // TODO: check if token is ERC20
        _allowedTokens[token] = true;
    }

    function removeAllowedToken(address token) external onlyOwner {
        delete _allowedTokens[token];
    }

    function addAllowedTokens(address[] calldata tokens) external onlyOwner {
        // TODO: check if token is ERC20

        uint256 len = tokens.length;
        for (uint256 i = 0; i < len; ) {
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
