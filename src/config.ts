// Environment configuration for TerraTag app

import { ethers } from "ethers";

// Contract configuration
export const contractAddress = "0xd0baEfE4e7b9B2E7D427365aA29e19632281cC2c";

// Contract ABI (Application Binary Interface)
export const contractAbi = [
  {
    type: "function",
    name: "cancelSwapRequest",
    inputs: [{ name: "swapId", type: "bytes32", internalType: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claim",
    inputs: [{ name: "squareName", type: "string", internalType: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deleteUserAndReleaseLands",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getUserInventory",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "string[]", internalType: "string[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "pendingSwaps",
    inputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    outputs: [
      { name: "requester", type: "address", internalType: "address" },
      { name: "counterparty", type: "address", internalType: "address" },
      { name: "requesterSquare", type: "string", internalType: "string" },
      { name: "counterpartySquare", type: "string", internalType: "string" },
      { name: "counterpartyApproved", type: "bool", internalType: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "release",
    inputs: [{ name: "squareName", type: "string", internalType: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "squareOwner",
    inputs: [{ name: "", type: "string", internalType: "string" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "swap",
    inputs: [
      { name: "mySquareName", type: "string", internalType: "string" },
      { name: "theirSquareName", type: "string", internalType: "string" },
      { name: "otherUser", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "userInventory",
    inputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Claimed",
    inputs: [
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "squareName",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Released",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "squareName",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SwapApproved",
    inputs: [
      {
        name: "approver",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "swapId",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SwapRequested",
    inputs: [
      {
        name: "requester",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "counterparty",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "requesterSquare",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "counterpartySquare",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Swapped",
    inputs: [
      {
        name: "user1",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "user2",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "squareName1",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "squareName2",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "UserDeleted",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
  {
    type: "function",
    name: "getUserInventoryByEvents",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "string[]", internalType: "string[]" }],
    stateMutability: "view",
  },
];

// What3words API key
export const W3W_API_KEY = "AA67Q035";

// Map settings
export const MAP_CONFIG = {
  initialZoom: 15,
  squareSize: 0.9, // Size of each land square in 3D view
  heightScale: 0.2, // Height of squares in 3D view
  nearbyRadius: 1.0, // Radius in kilometers to consider squares as "nearby"
};

// Network settings
export const NETWORK = {
  REQUIRED: {
    chainId: 80002, // Polygon Amoy testnet
    chainIdHex: "0x13882", // Hex version of chainId (corrected from 0x13881)
    name: "Polygon Amoy Testnet",
    currency: {
      name: "POL",
      symbol: "POL",
      decimals: 18,
    },
    // Add multiple fallback RPC URLs to handle rate limiting
    rpcUrls: [
      "https://rpc-amoy.polygon.technology/",
      "https://polygon-amoy.blockpi.network/v1/rpc/public",
      "https://polygon-amoy.public.blastapi.io",
    ],
    blockExplorerUrls: ["https://amoy.polygonscan.com/"],
  },
  // Add more networks if needed in the future
  SUPPORTED_NETWORKS: {
    "0x13882": {
      name: "Polygon Amoy Testnet",
      shortName: "Amoy",
      color: "text-purple-400",
      bgColor: "bg-purple-900/30",
      borderColor: "border-purple-800/30",
      icon: "🟣",
    },
  },
};

// Helper function to check if the contract has the required functions
export async function checkContractCompatibility(contract: ethers.Contract) {
  try {
    // Check if the contract supports the interface we need
    const functions: Record<string, boolean> = {
      getUserInventory: false,
      squareOwner: false,
      claim: false,
      release: false,
      swap: false,
      deleteUserAndReleaseLands: false,
    };

    // Test each function existence
    for (const funcName of Object.keys(functions)) {
      try {
        const isFunction = typeof contract[funcName] === "function";
        functions[funcName] = isFunction;
        console.log(
          `Contract ${funcName} support: ${isFunction ? "Yes" : "No"}`
        );
      } catch (e: unknown) {
        console.warn(`Error checking ${funcName}:`, e);
      }
    }

    return {
      compatible: Object.values(functions).every(Boolean),
      functions,
    };
  } catch (error: unknown) {
    console.error("Error checking contract compatibility:", error);
    return {
      compatible: false,
      functions: {},
      error,
    };
  }
}
