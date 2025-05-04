import { ethers } from "ethers";
import { contractAddress, contractAbi, NETWORK } from "@/config";

// TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

/**
 * Get a user's inventory of land squares by querying blockchain events
 * This is a fallback method when the contract's getUserInventory function fails
 *
 * @param {ethers.Contract} contract - The LandRegistry contract instance
 * @param {string} userAddress - The address of the user
 * @param {ethers.providers.Provider} provider - The ethereum provider
 * @returns {Promise<string[]>} - Array of what3words land squares owned by the user
 */
export async function getUserInventoryFromEvents(
  contract: ethers.Contract,
  userAddress: string
): Promise<string[]> {
  try {
    // Query for Claimed events where this user is the owner
    const claimedFilter = contract.filters.Claimed(userAddress);
    const claimedEvents = await contract.queryFilter(claimedFilter);

    // Query for Released events where this user is the previous owner
    const releasedFilter = contract.filters.Released(userAddress);
    const releasedEvents = await contract.queryFilter(releasedFilter);

    // Query for Swap events where this user is involved
    // This requires checking both user1 and user2 positions
    const swappedFilter1 = contract.filters.Swapped(userAddress);
    const swappedEvents1 = await contract.queryFilter(swappedFilter1);

    const swappedFilter2 = contract.filters.Swapped(null, userAddress);
    const swappedEvents2 = await contract.queryFilter(swappedFilter2);

    // Build a map to track current ownership
    const ownershipMap = new Map<string, boolean>();

    // Process claim events
    claimedEvents.forEach((event) => {
      if (event.args && event.args.squareName) {
        ownershipMap.set(event.args.squareName, true);
      }
    });

    // Process release events (remove from ownership)
    releasedEvents.forEach((event) => {
      if (event.args && event.args.squareName) {
        ownershipMap.delete(event.args.squareName);
      }
    });

    // Process swap events where user is user1
    swappedEvents1.forEach((event) => {
      if (event.args) {
        // Remove the square they gave away
        ownershipMap.delete(event.args.squareName1);
        // Add the square they received
        ownershipMap.set(event.args.squareName2, true);
      }
    });

    // Process swap events where user is user2
    swappedEvents2.forEach((event) => {
      if (event.args) {
        // Remove the square they gave away
        ownershipMap.delete(event.args.squareName2);
        // Add the square they received
        ownershipMap.set(event.args.squareName1, true);
      }
    });

    // Convert map keys to array
    return Array.from(ownershipMap.keys());
  } catch (error) {
    console.error("Error fetching inventory from events:", error);
    return [];
  }
}

/**
 * Verify if a contract exists and has code at the specified address
 *
 * @param {string} address - The contract address
 * @param {ethers.providers.Provider} provider - The ethereum provider
 * @returns {Promise<boolean>} - Whether there is contract code at the address
 */
export async function verifyContractExists(
  address: string,
  provider: ethers.providers.Provider
): Promise<boolean> {
  const code = await provider.getCode(address);
  return code !== "0x"; // '0x' means no code at the address
}

/**
 * Get the owner of a square directly using low-level call
 * This is a fallback in case the squareOwner function fails
 *
 * @param {string} squareName - The what3words square name
 * @param {string} contractAddress - The address of the LandRegistry contract
 * @param {ethers.providers.Provider} provider - The ethereum provider
 * @returns {Promise<string>} - Address of the owner, or zero address if unclaimed
 */
export async function getSquareOwnerFallback(
  squareName: string,
  contractAddress: string,
  provider: ethers.providers.Provider
): Promise<string> {
  try {
    // Encode function signature and parameters for a direct call
    const functionSignature = "squareOwner(string)";
    const functionSelector = ethers.utils
      .id(functionSignature)
      .substring(0, 10);
    const encodedParams = ethers.utils.defaultAbiCoder.encode(
      ["string"],
      [squareName]
    );
    const callData = functionSelector + encodedParams.substring(2); // Remove '0x' from params

    const result = await provider.call({
      to: contractAddress,
      data: callData,
    });

    // Decode the result
    const decodedResult = ethers.utils.defaultAbiCoder.decode(
      ["address"],
      result
    );
    return decodedResult[0];
  } catch (error) {
    console.error("Error in fallback owner check:", error);
    return ethers.constants.AddressZero;
  }
}

// Setup contract with MetaMask
export async function setupContract(provider: ethers.providers.Web3Provider) {
  try {
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractAbi, signer);
    return { contract, signer };
  } catch (error) {
    console.error("Error setting up contract:", error);
    throw error;
  }
}

// Get user's inventory - using server API when possible
export async function getUserInventory(
  address: string,
  contract: ethers.Contract | null = null
) {
  try {
    // Use server API if no contract instance is provided
    if (!contract) {
      const response = await fetch(
        `/api/contract?action=getUserInventory&userAddress=${address}`
      );
      if (!response.ok) throw new Error("Failed to fetch inventory from API");
      const data = await response.json();
      return data.inventory;
    }

    // Otherwise use client-side contract
    return await contract.getUserInventory(address);
  } catch (error) {
    console.error("Error getting user inventory:", error);
    throw error;
  }
}

// Check the owner of a square - using server API when possible
export async function getSquareOwner(
  squareName: string,
  contract: ethers.Contract | null = null
) {
  try {
    // Use server API if no contract instance is provided
    if (!contract) {
      const response = await fetch(
        `/api/contract?action=getOwner&squareName=${encodeURIComponent(
          squareName
        )}`
      );
      if (!response.ok) throw new Error("Failed to fetch owner from API");
      const data = await response.json();
      return data.owner;
    }

    // Otherwise use client-side contract
    return await contract.squareOwner(squareName);
  } catch (error) {
    console.error("Error checking square owner:", error);
    throw error;
  }
}

// Connect to wallet
export async function connectWallet() {
  if (!window?.ethereum) {
    throw new Error("MetaMask not installed");
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    // Setup ethers provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Get network information
    const network = await provider.getNetwork();

    // Check if we're on the right network
    if (network.chainId !== NETWORK.REQUIRED.chainId) {
      try {
        // Try to switch to the required network
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: NETWORK.REQUIRED.chainIdHex }],
        });
      } catch (switchError: unknown) {
        // If the network is not available, try to add it
        if ((switchError as { code?: number }).code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: NETWORK.REQUIRED.chainIdHex,
                chainName: NETWORK.REQUIRED.name,
                nativeCurrency: NETWORK.REQUIRED.currency,
                rpcUrls: NETWORK.REQUIRED.rpcUrls,
                blockExplorerUrls: NETWORK.REQUIRED.blockExplorerUrls,
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    }

    // Setup contract
    const { contract, signer } = await setupContract(provider);

    return {
      account: accounts[0],
      provider,
      signer,
      contract,
    };
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
}
