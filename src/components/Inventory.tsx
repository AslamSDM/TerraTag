import React, { useCallback, useEffect, useState } from "react";
import { InventoryProps } from "../types";
import { Button } from "./ui/button";
import { ethers } from "ethers";
import {
  getUserInventoryFromEvents,
  getSquareOwnerFallback,
} from "../lib/contractUtils";
import { contractAddress } from "../config";

const Inventory: React.FC<InventoryProps> = ({
  contract,
  account,
  inventory,
  setInventory,
  setStatus,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [squareOwner, setSquareOwner] = useState<string | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (contract && account) {
      setStatus("Fetching inventory...");
      try {
        // Try the main getUserInventory function first
        const ownedSquares = await contract.getUserInventory(account);
        setInventory(ownedSquares);
        setStatus("Inventory updated.");
        setUsedFallback(false);
        console.log("Inventory:", ownedSquares);
      } catch (error: any) {
        console.error("Error fetching inventory:", error);

        // Enhanced error reporting
        if (error.code === "CALL_EXCEPTION") {
          console.error("Contract call failed. Trying fallback method...");

          // Use our fallback method that gets inventory from events
          try {
            setStatus("Primary inventory method failed. Using fallback...");

            // Use the fallback method to get inventory from events
            const fallbackInventory = await getUserInventoryFromEvents(
              contract,
              account
            );

            if (fallbackInventory.length > 0) {
              setInventory(fallbackInventory);
              setStatus("Inventory retrieved using fallback method.");
              setUsedFallback(true);
              console.log("Fallback inventory:", fallbackInventory);
            } else {
              // If even the fallback returns empty, we'll show a warning
              // but still set an empty inventory
              setInventory([]);
              setStatus("No land parcels found.");
            }
          } catch (fallbackError) {
            console.error("Fallback inventory method failed:", fallbackError);
            setStatus(`Error fetching inventory: ${error.message}`);
            setInventory([]); // Clear inventory on error
          }
        } else {
          // For other types of errors
          setStatus(`Error fetching inventory: ${error.message}`);
          setInventory([]); // Clear inventory on error
        }
      }
    } else {
      setInventory([]); // Clear if no contract or account
    }
  }, [contract, account, setInventory, setStatus]); // Dependencies

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]); // Fetch when contract/account changes

  const handleSquareSelect = async (square: string) => {
    setSelectedSquare(square);

    if (contract) {
      setLoadingOwner(true);
      try {
        // Try the main squareOwner function first
        let owner;
        try {
          owner = await contract.squareOwner(square);
        } catch (error) {
          console.warn(
            "Error using squareOwner function, trying fallback:",
            error
          );

          // Use our fallback method to check ownership
          owner = await getSquareOwnerFallback(
            square,
            contractAddress,
            contract.provider
          );
        }

        setSquareOwner(owner);

        if (owner === account) {
          setStatus(`You own /// ${square}`);
        } else if (owner === ethers.constants.AddressZero) {
          setStatus(`/// ${square} is unclaimed`);
        } else {
          setStatus(
            `/// ${square} is owned by ${owner.substring(
              0,
              6
            )}...${owner.substring(38)}`
          );
        }
      } catch (error: any) {
        console.error("Error fetching square owner:", error);
        setStatus(`Error fetching owner: ${error.message}`);
        setSquareOwner(null);
      } finally {
        setLoadingOwner(false);
      }
    }
  };

  const handleRelease = async (square: string) => {
    if (!contract || !account) {
      setStatus("Connect wallet first");
      return;
    }

    if (!window.confirm(`Are you sure you want to release /// ${square}?`)) {
      return;
    }

    setStatus(`Releasing /// ${square}...`);
    try {
      const tx = await contract.release(square);
      setStatus(
        `Transaction sent. Waiting for confirmation... Hash: ${tx.hash.substring(
          0,
          10
        )}...`
      );
      await tx.wait();
      setStatus(`Successfully released /// ${square}`);

      // Update inventory after release
      fetchInventory();
    } catch (error: any) {
      console.error("Error releasing square:", error);
      let reason = error.reason;
      if (error.data?.message) {
        reason = error.data.message.replace("execution reverted: ", "");
      } else if (error.error?.message) {
        reason = error.error.message.replace("execution reverted: ", "");
      }
      setStatus(`Error releasing square: ${reason || error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-medium">Your Land</h2>
          <span className="bg-blue-900/30 text-white text-xs py-0.5 px-2 rounded-full">
            {inventory.length} parcels
          </span>
          {usedFallback && (
            <span className="bg-amber-900/30 text-white text-xs py-0.5 px-2 rounded-full">
              Fallback
            </span>
          )}
        </div>
        <Button
          onClick={fetchInventory}
          disabled={!account || !contract}
          variant="outline"
          size="sm"
          className="text-white border-slate-600 hover:bg-slate-700 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <path d="M3 2v6h6"></path>
            <path d="M21 12A9 9 0 0 0 3.86 8.14"></path>
            <path d="M21 22v-6h-6"></path>
            <path d="M3 12a9 9 0 0 0 17.14 3.86"></path>
          </svg>
          Refresh
        </Button>
      </div>

      {inventory.length === 0 ? (
        <div className="py-8 text-center">
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 inline-flex p-3 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <path d="M3 9h18"></path>
              <path d="M9 21V9"></path>
            </svg>
          </div>
          <p className="text-white">You don't own any land parcels yet.</p>
          <p className="text-white text-sm mt-1">
            Use the Actions panel to claim your first square.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-3 max-h-[200px] overflow-y-auto">
            {inventory.map((square, index) => (
              <div
                key={index}
                className={`flex items-center justify-between py-2 px-3 odd:bg-slate-800/30 
                  even:bg-transparent rounded-md group hover:bg-slate-700/50 transition-colors
                  ${
                    selectedSquare === square
                      ? "bg-blue-900/30 !border-blue-800/50"
                      : ""
                  }`}
                onClick={() => handleSquareSelect(square)}
              >
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                  <div className="font-medium text-white group-hover:text-white transition-colors">
                    /// {square}
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRelease(square);
                    }}
                    className="h-7 text-xs text-white hover:text-white hover:bg-amber-950/20"
                  >
                    Release
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {selectedSquare && (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-md p-3 text-sm">
              <h4 className="font-medium text-white mb-1">
                /// {selectedSquare}
              </h4>
              <div className="flex items-center text-xs text-white">
                <span>Owner: </span>
                {loadingOwner ? (
                  <span className="ml-1 flex items-center">
                    <svg
                      className="animate-spin h-3 w-3 mr-1"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  <span className="ml-1">
                    {squareOwner === account ? (
                      <span className="text-white">You</span>
                    ) : squareOwner === ethers.constants.AddressZero ? (
                      <span className="text-white">Unclaimed</span>
                    ) : (
                      <span className="font-mono text-white">
                        {squareOwner?.substring(0, 6)}...
                        {squareOwner?.substring(38)}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}

          {usedFallback && (
            <div className="bg-amber-900/20 border border-amber-800/30 rounded-md p-3 text-xs text-white">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 flex-shrink-0"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <p>
                  Using fallback inventory method. The contract's
                  getUserInventory function is not available. Inventory data is
                  reconstructed from blockchain events and may not be complete
                  or up-to-date.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Inventory;
