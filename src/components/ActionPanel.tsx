import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ActionPanelProps } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

const ActionPanel: React.FC<ActionPanelProps> = ({
  contract,
  account,
  currentW3W,
  refreshInventory,
  setStatus,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null); // 'claim', 'release', 'swap', 'cancelSwap'
  const [releaseTarget, setReleaseTarget] = useState(""); // w3w string to release
  const [swapMySquare, setSwapMySquare] = useState(""); // w3w string
  const [swapTheirSquare, setSwapTheirSquare] = useState(""); // w3w string
  const [swapOtherUser, setSwapOtherUser] = useState(""); // address
  const [pendingSwaps, setPendingSwaps] = useState<any[]>([]);
  const [loadingSwaps, setLoadingSwaps] = useState(false);
  const [theirSquareOwner, setTheirSquareOwner] = useState<string | null>(null);
  const [checkingOwner, setCheckingOwner] = useState(false);
  const [theirSquareUnclaimed, setTheirSquareUnclaimed] = useState(false);

  // Function to fetch pending swaps (this is a simplified implementation)
  const fetchPendingSwaps = async () => {
    if (!contract || !account) return;

    setLoadingSwaps(true);
    try {
      // Get user inventory first to check what lands they own
      await contract.getUserInventory(account);

      // For each owned square, we'll check recent events to find pending swap requests
      // This is a simplified approach - for production, you'd likely use event filters or a more efficient method

      // This implementation is simplified - in a real app, you would probably use events or a more efficient method
      // to track pending swaps. We'll mock this for the demo.
      const mockPendingSwaps: any[] = [];

      setPendingSwaps(mockPendingSwaps);
      setStatus("Pending swaps updated");
    } catch (error: any) {
      console.error("Error fetching pending swaps:", error);
      setStatus(`Error fetching pending swaps: ${error.message}`);
    } finally {
      setLoadingSwaps(false);
    }
  };

  useEffect(() => {
    if (contract && account) {
      fetchPendingSwaps();
    }
  }, [contract, account]);

  // Check owner of a square when entered in the swap form
  const checkSquareOwner = async (squareName: string) => {
    if (!contract || !squareName.trim()) {
      setTheirSquareOwner(null);
      setTheirSquareUnclaimed(false);
      return;
    }

    setCheckingOwner(true);
    try {
      const owner = await contract.squareOwner(squareName);
      console.log(`Owner of ${squareName}:`, owner);

      // Check if the square is owned by someone
      const zeroAddress = ethers.constants.AddressZero;
      if (owner === zeroAddress) {
        setTheirSquareUnclaimed(true);
        setTheirSquareOwner(null);
      } else {
        setTheirSquareUnclaimed(false);
        setTheirSquareOwner(owner);
        setSwapOtherUser(owner);
      }
    } catch (error) {
      console.error("Error checking square owner:", error);
      setTheirSquareOwner(null);
      setTheirSquareUnclaimed(false);
    } finally {
      setCheckingOwner(false);
    }
  };

  // Effect to check owner whenever the swap square changes
  useEffect(() => {
    if (swapTheirSquare) {
      checkSquareOwner(swapTheirSquare);
    } else {
      setTheirSquareOwner(null);
      setTheirSquareUnclaimed(false);
    }
  }, [swapTheirSquare]);

  const handleAction = async (actionType: string, swapId?: string) => {
    if (!contract || !account) {
      setStatus("Please connect your wallet first.");
      return;
    }

    // For claim actions, validate that the user is at the location they're trying to claim
    if (actionType === "claim") {
      if (!currentW3W) {
        setStatus("Cannot claim: Current location unknown.");
        return;
      }

      // The user must be physically present at the location to claim it
      // This is already enforced by only having a button for the current location
    }

    if (actionType === "release" && !releaseTarget) {
      setStatus("Please enter the square name to release.");
      return;
    }
    if (
      actionType === "swap" &&
      (!swapMySquare || !swapTheirSquare || !swapOtherUser)
    ) {
      setStatus("Please fill in all fields for the swap.");
      return;
    }
    if (actionType === "swap" && !ethers.utils.isAddress(swapOtherUser)) {
      setStatus("Invalid address provided for the other user.");
      return;
    }
    if (actionType === "cancelSwap" && !swapId) {
      setStatus("No swap ID provided for cancellation.");
      return;
    }

    setLoadingAction(actionType);
    setStatus(`Processing ${actionType}...`);

    try {
      let tx;
      switch (actionType) {
        case "claim":
          // Using only currentW3W to ensure we're claiming the current location
          tx = await contract.claim(currentW3W);
          break;
        case "release":
          tx = await contract.release(releaseTarget);
          break;
        case "swap":
          tx = await contract.swap(
            swapMySquare,
            swapTheirSquare,
            swapOtherUser
          );
          break;
        case "cancelSwap":
          tx = await contract.cancelSwapRequest(swapId);
          break;
        default:
          throw new Error("Invalid action type");
      }

      setStatus(
        `Transaction sent (${actionType}). Waiting for confirmation... Hash: ${tx.hash.substring(
          0,
          10
        )}...`
      );
      await tx.wait(); // Wait for transaction confirmation
      setStatus(
        `${
          actionType.charAt(0).toUpperCase() + actionType.slice(1)
        } successful!`
      );

      // Clear inputs after successful action
      if (actionType === "release") setReleaseTarget("");
      if (actionType === "swap") {
        setSwapMySquare("");
        setSwapTheirSquare("");
        setSwapOtherUser("");
        setTheirSquareOwner(null);
        setTheirSquareUnclaimed(false);
      }
      if (actionType === "cancelSwap") {
        fetchPendingSwaps(); // Refresh pending swaps list
      }

      // Refresh inventory after claim, release, or swap
      refreshInventory();
    } catch (error: any) {
      console.error(`Error during ${actionType}:`, error);
      // Try to parse revert reason
      let reason = error.reason;
      if (error.data?.message) {
        // Check ethers v5 error structure
        reason = error.data.message.replace("execution reverted: ", "");
      } else if (error.error?.message) {
        // Check for nested error object
        reason = error.error.message.replace("execution reverted: ", "");
      }
      setStatus(`Error during ${actionType}: ${reason || error.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Claim Action - Only for current location */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-white">Claim Square</h3>
          {currentW3W && (
            <div className="text-xs bg-emerald-900/30 text-white px-2 py-0.5 rounded-full">
              Current Location
            </div>
          )}
        </div>

        <Button
          onClick={() => handleAction("claim")}
          disabled={!currentW3W || loadingAction === "claim" || !account}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium h-12"
        >
          {loadingAction === "claim" ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
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
              Claiming...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <path d="M3 9h18"></path>
                <path d="M9 21V9"></path>
              </svg>
              {currentW3W
                ? `Claim /// ${currentW3W}`
                : "Select a location first"}
            </>
          )}
        </Button>
        {!currentW3W ? (
          <p className="text-xs text-white text-center">
            Waiting for current location...
          </p>
        ) : (
          <p className="text-xs text-white text-center">
            You can only claim the square you're currently located in
          </p>
        )}
      </div>

      <Separator className="bg-slate-700/50" />

      {/* Release Action */}
      {/* <div className="space-y-3">
        <h3 className="text-sm font-medium text-white">Release Square</h3>
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Enter what3words to release (e.g., word.word.word)"
            value={releaseTarget}
            onChange={(e) => setReleaseTarget(e.target.value)}
            className="bg-slate-700/50 border-slate-600 focus-visible:ring-blue-500"
          />
          <Button
            onClick={() => handleAction("release")}
            disabled={!releaseTarget || loadingAction === "release" || !account}
            variant="outline"
            className="w-full border-amber-600/30 text-white hover:bg-amber-900/20 hover:text-white"
          >
            {loadingAction === "release" ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                Releasing...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                Release Square
              </>
            )}
          </Button>
        </div>
      </div> */}

      <Separator className="bg-slate-700/50" />

      {/* Swap Action */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white">Swap Squares</h3>
        <div className="space-y-3">
          {/* Your Square */}
          <div>
            <p className="text-xs text-white mb-1">Your Square</p>
            <Input
              type="text"
              placeholder="Your what3words square"
              value={swapMySquare}
              onChange={(e) => setSwapMySquare(e.target.value)}
              className="bg-slate-700/50 border-slate-600 focus-visible:ring-purple-500"
            />
          </div>

          {/* Their Square */}
          <div>
            <p className="text-xs text-white mb-1">Their Square</p>
            <Input
              type="text"
              placeholder="Their what3words square"
              value={swapTheirSquare}
              onChange={(e) => setSwapTheirSquare(e.target.value)}
              className={`bg-slate-700/50 border-slate-600 focus-visible:ring-purple-500
                ${
                  theirSquareUnclaimed
                    ? "border-amber-500 ring-1 ring-amber-500/30"
                    : ""
                }
                ${
                  theirSquareOwner && !theirSquareUnclaimed
                    ? "border-blue-500 ring-1 ring-blue-500/30"
                    : ""
                }
              `}
            />
            {/* Show status of the square - owned, unclaimed, or checking */}
            {swapTheirSquare && (
              <div className="mt-1">
                {checkingOwner && (
                  <div className="text-xs text-white flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-3 w-3"
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
                    Checking ownership...
                  </div>
                )}

                {!checkingOwner && theirSquareUnclaimed && (
                  <div className="text-xs text-white flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                      <path d="M12 9v4"></path>
                      <path d="M12 17h.01"></path>
                    </svg>
                    This square is unclaimed. You need to go to this location to
                    claim it first.
                  </div>
                )}

                {!checkingOwner && theirSquareOwner && (
                  <div className="text-xs text-white">
                    Owned by: {theirSquareOwner.substring(0, 6)}...
                    {theirSquareOwner.substring(38)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Other user address - auto-filled but editable */}
          <div className={theirSquareUnclaimed ? "opacity-50" : ""}>
            <p className="text-xs text-white mb-1">Other User's Address</p>
            <Input
              type="text"
              placeholder="0x..."
              value={swapOtherUser}
              onChange={(e) => setSwapOtherUser(e.target.value)}
              disabled={theirSquareUnclaimed}
              className="bg-slate-700/50 border-slate-600 focus-visible:ring-purple-500 font-mono"
            />
          </div>

          {theirSquareUnclaimed && currentW3W === swapTheirSquare ? (
            // If unclaimed and user is at that location, show claim button instead
            <Button
              onClick={() => handleAction("claim")}
              disabled={loadingAction === "claim" || !account}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <path d="M3 9h18"></path>
                <path d="M9 21V9"></path>
              </svg>
              Claim This Square Now
            </Button>
          ) : theirSquareUnclaimed ? (
            // If unclaimed but user is not at that location
            <div className="p-3 bg-amber-900/20 border border-amber-800/30 rounded-md text-white text-xs">
              <p className="flex items-center">
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
                  className="mr-2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                You must be physically present at this location to claim it.
              </p>
            </div>
          ) : (
            // Normal swap button
            <Button
              onClick={() => handleAction("swap")}
              disabled={
                !swapMySquare ||
                !swapTheirSquare ||
                !swapOtherUser ||
                loadingAction === "swap" ||
                !account
              }
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {loadingAction === "swap" ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                  Swapping...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <polyline points="17 1 21 5 17 9"></polyline>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <polyline points="7 23 3 19 7 15"></polyline>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                  </svg>
                  Initiate Swap
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Pending Swaps Section */}
      {pendingSwaps.length > 0 && (
        <>
          <Separator className="bg-slate-700/50" />

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white flex items-center justify-between">
              <span>Pending Swap Requests</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchPendingSwaps}
                className="h-7 text-xs"
                disabled={loadingSwaps}
              >
                {loadingSwaps ? (
                  <svg
                    className="animate-spin h-3 w-3"
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
                ) : (
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
                  >
                    <path d="M3 2v6h6"></path>
                    <path d="M21 12A9 9 0 0 0 3.86 8.14"></path>
                    <path d="M21 22v-6h-6"></path>
                    <path d="M3 12a9 9 0 0 0 17.14 3.86"></path>
                  </svg>
                )}
              </Button>
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendingSwaps.map((swap, idx) => (
                <div
                  key={idx}
                  className="bg-slate-700/30 p-3 rounded-md border border-slate-700 text-sm"
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-white">
                      <span className="text-white font-medium">
                        {swap.requesterSquare}
                      </span>
                      {" ↔ "}
                      <span className="text-white font-medium">
                        {swap.counterpartySquare}
                      </span>
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleAction("cancelSwap", swap.id)}
                      disabled={loadingAction === "cancelSwap"}
                      className="h-6 text-xs bg-red-800/40 hover:bg-red-700/60"
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className="text-xs text-white">
                    With: {swap.counterparty.substring(0, 6)}...
                    {swap.counterparty.substring(38)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ActionPanel;
