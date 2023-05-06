Implement ERC721 NFT with ERC20 tokens wrapping functionality. Each user can mint new NFT by transferring one or several different ERC20 tokens. Users can transfer only allowed ERC20 tokens. Owner can add or remove ERC20 tokens from allowed token’s registry. Users can burn their NFTs to receive 99.5% of their ERC20 tokens back. 0.5% of all tokens remain as protocol fee. Owner can withdraw protocol fees any time. During the withdrawal all fees automatically swapped to USDC with Uniswap so owner receives only USDC

Requirements:

- Candidate may use OpenZeppelin contracts
- Hardhat initialization is required (Typescript setup is preferred)
- Add repository to GitHub
- Adding tests is not mandatory but will be a plus
- Making contracts upgradable will be a plus
