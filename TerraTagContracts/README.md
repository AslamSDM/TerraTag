# TerraTag Contracts

This repository contains the smart contracts for the TerraTag project, a system for managing ownership of land squares represented by what3words strings.

## Project Overview

TerraTag allows users to:
- Claim unowned land squares
- Release owned squares
- Swap squares with other users
- Delete their account and release all owned squares

## Development Environment

This project uses [Foundry](https://getfoundry.sh/) for development, testing, and deployment.

### Prerequisites

- [Foundry](https://getfoundry.sh/)
- Solidity ^0.8.9

## Getting Started

### Installing Dependencies

```bash
forge install
```

### Building

```bash
forge build
```

### Running Tests

Run all tests:

```bash
forge test
```

Run specific test:

```bash
forge test --match-test testClaim -vv
```

For more verbose output, add more `v` flags:

```bash
forge test -vvv
```

## Deployment

### Setting up Environment

Create a `.env` file with your private key:

```
PRIVATE_KEY=your_private_key_here
```

Load the environment variables:

```bash
source .env
```

### Deploying to Networks

#### Local Development Network (Anvil)

Start a local node:

```bash
anvil
```

Deploy:

```bash
forge script script/DeployLandRegistry.s.sol --rpc-url http://localhost:8545 --broadcast
```

#### Deploying to Polygon

We've created a specific script for Polygon deployment that uses a public RPC endpoint:

```bash
forge script script/DeployToPolygon.s.sol --broadcast
```

This will automatically use the public Polygon RPC URL (`https://polygon-rpc.com`) that doesn't require authentication.

#### Deploying to Other Networks

For other networks, you can use the helper functions:

```bash
# Example for Mumbai testnet
forge script script/DeployHelper.s.sol:DeployHelper --sig "deployLandRegistry(string)" "mumbai" --broadcast

# Example for Ethereum mainnet
forge script script/DeployHelper.s.sol:DeployHelper --sig "deployLandRegistry(string)" "ethereum" --broadcast
```

#### Using Custom RPC URLs

If you prefer to use your own RPC provider:

```bash
forge script script/DeployLandRegistry.s.sol --rpc-url YOUR_RPC_URL --broadcast
```

For Ankr or other services requiring an API key:

```bash
forge script script/DeployLandRegistryWithConfig.s.sol --rpc-url "https://rpc.ankr.com/polygon/YOUR_API_KEY" --broadcast
```

## Contract Architecture

The main contract is `LandRegistry.sol`, which manages ownership of land squares.

### Key Functions

- `claim(string memory squareName)`: Claim an unclaimed square
- `release(string memory squareName)`: Release an owned square
- `swap(string memory mySquareName, string memory theirSquareName, address otherUser)`: Initiate or complete a swap
- `deleteUserAndReleaseLands()`: Delete user account and release all owned squares
- `getUserInventory(address user)`: Get all squares owned by a user

## License

MIT
