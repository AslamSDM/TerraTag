# TerraTag Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Smart Contracts](#smart-contracts)
4. [Frontend Application](#frontend-application)
5. [Key Components](#key-components)
6. [Getting Started](#getting-started)
7. [Development Workflow](#development-workflow)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [API Reference](#api-reference)

## Project Overview

TerraTag is a decentralized application (dApp) that allows users to claim, manage, and trade virtual land parcels represented by What3Words (W3W) addresses. The application combines blockchain technology with geolocation services to create a digital ownership system for physical locations.

**Key Features:**

- Claim ownership of land squares using What3Words geolocation standards
- Visual 3D representation of owned land parcels
- Trade land with other users through a smart contract
- Manage inventory of owned land parcels
- Connect wallet functionality for secure blockchain interactions

## System Architecture

TerraTag consists of two main components:

1. **Smart Contracts (Solidity)**

   - LandRegistry.sol: Core contract for managing land ownership and transfers
   - Deployed on Polygon Mumbai testnet

2. **Frontend Application (React + TypeScript + Vite)**
   - User interface for interacting with smart contracts
   - 3D visualization of land using Three.js via React Three Fiber
   - Wallet connectivity and blockchain interaction
   - Geolocation services integration

## Smart Contracts

### LandRegistry Contract

The core smart contract (`LandRegistry.sol`) manages the ownership of land squares represented by What3Words strings.

**Key Functionalities:**

- **claim(string squareName)**: Allows users to claim unclaimed land squares
- **release(string squareName)**: Releases a square back to the unclaimed pool
- **swap(string mySquareName, string theirSquareName, address otherUser)**: Initiates or completes a land swap between two users
- **cancelSwapRequest(bytes32 swapId)**: Cancels a pending swap request
- **deleteUserAndReleaseLands()**: Deletes a user account and releases all owned squares
- **getUserInventory(address user)**: Returns all squares owned by a specific user

**Data Structures:**

- `squareOwner`: Mapping from W3W address to owner's address
- `userInventory`: Mapping from user's address to array of owned W3W addresses
- `pendingSwaps`: Mapping to store pending swap requests

## Frontend Application

### Project Structure

```
/TerraTag
├── public/                  # Static assets
├── src/
│   ├── assets/              # Images and SVGs
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   ├── ActionPanel.tsx  # Actions for claiming/releasing land
│   │   ├── ConnectWallet.tsx # Wallet connection component
│   │   ├── Inventory.tsx    # User's owned land display
│   │   ├── LandVisualization.tsx # 3D visualization of land
│   │   ├── LocationInfo.tsx # Geographic location display
│   │   └── Settings.tsx     # User settings panel
│   ├── lib/                 # Utility functions
│   │   ├── contractUtils.ts # Blockchain interaction utilities
│   │   └── utils.ts         # General utilities
│   ├── App.tsx              # Main application component
│   ├── config.ts            # Application configuration
│   ├── main.tsx             # Entry point
│   └── types.ts             # TypeScript type definitions
├── TerraTag/                # Testing directory
└── TerraTagContracts/       # Smart contracts
```

## Key Components

### LandVisualization Component

The LandVisualization component provides a 3D representation of claimed land parcels using React Three Fiber (Three.js wrapper). It displays:

- Land squares with colors based on W3W addresses
- Current user location as a central reference point
- Visual indicators for owned vs. unclaimed squares
- Interactive 3D environment with zoom and pan capabilities

The component converts W3W addresses to geographic coordinates and renders them as 3D squares in a relative coordinate system centered on the user's current position.

### ConnectWallet Component

Handles blockchain wallet connectivity (MetaMask, etc.) and maintains the user's authenticated state throughout the application.

### ActionPanel Component

Provides user interface for key actions:

- Claiming new land squares
- Releasing owned squares
- Initiating swaps with other users

### Inventory Component

Displays the user's currently owned land squares and allows for selection and management.

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- MetaMask or compatible Ethereum wallet
- Polygon Mumbai testnet configured in wallet

### Installation

1. Clone the repository

   ```
   git clone <repository-url>
   cd TerraTag
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Start the development server

   ```
   npm run dev
   ```

4. Connect your wallet to the Mumbai testnet and ensure you have test MATIC tokens

## Development Workflow

1. **Smart Contract Development**

   - Edit contracts in `TerraTagContracts/src/`
   - Test contracts with `forge test`
   - Deploy contracts with the deployment script in `TerraTagContracts/script/`

2. **Frontend Development**
   - Run the development server with `npm run dev`
   - Components are located in `src/components/`
   - Update contract interactions in `src/lib/contractUtils.ts`

## Testing

### Smart Contract Tests

The project includes tests for the LandRegistry contract in `TerraTagContracts/test/LandRegistry.t.sol`.

Run tests with:

```
cd TerraTagContracts
forge test
```

### Frontend Tests

Component tests are available in the `TerraTag/src/components/` directory with the `.test.tsx` extension.

Run tests with:

```
npm test
```

## Deployment

### Smart Contract Deployment

Deploy to Mumbai testnet:

```
cd TerraTagContracts
forge script script/DeployLandRegistry.s.sol --rpc-url mumbai --broadcast --verify
```

### Frontend Deployment

Build the frontend:

```
npm run build
```

The output in the `dist` directory can be deployed to any static hosting service.

## API Reference

### Smart Contract API

Refer to the [Smart Contracts](#smart-contracts) section for details on contract functions.

### Utility Functions

The application includes several utility functions in `src/lib/utils.ts`:

- `convertW3WToCoordinates(w3w: string)`: Converts a W3W address to latitude/longitude
- `getCurrentLocation()`: Gets user's current geographic position
- `calculateDistance(lat1, lon1, lat2, lon2)`: Calculates distance between coordinates

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Technical Details

### React + TypeScript + Vite

This project uses React with TypeScript in a Vite development environment providing:

- Fast Hot Module Replacement (HMR)
- TypeScript integration
- Efficient builds

Two official plugins are used:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### ESLint Configuration

The project uses ESLint with type-aware rules:

```js
// eslint.config.js
export default tseslint.config({
  extends: [
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

The project also includes React-specific linting with these plugins:

- [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x)
- [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom)
