import React, { useState } from "react";
import { SettingsProps } from "../types";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

const Settings: React.FC<SettingsProps> = ({
  contract,
  account,
  setStatus,
  setAccount,
  setProvider,
  setSigner,
  setContract,
  setInventory,
}) => {
  const [loadingDelete, setLoadingDelete] = useState<boolean>(false);

  const handleDeleteAccount = async () => {
    if (!contract || !account) {
      setStatus("Connect wallet first.");
      return;
    }
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This will release ALL your claimed squares and cannot be undone."
      )
    ) {
      return;
    }

    setLoadingDelete(true);
    setStatus("Deleting account and releasing lands...");

    try {
      const tx = await contract.deleteUserAndReleaseLands();
      setStatus(
        `Transaction sent. Waiting for confirmation... Hash: ${tx.hash.substring(
          0,
          10
        )}...`
      );
      await tx.wait();
      setStatus("Account deleted and lands released successfully.");

      // Reset state after deletion (simulate disconnect)
      setInventory([]);
      // Optionally disconnect wallet fully - more complex, might require page reload or explicit disconnect logic
      // For simplicity here, we just clear the account state, but user might still be connected in MetaMask
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setContract(null);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      let reason = error.reason;
      if (error.data?.message) {
        reason = error.data.message.replace("execution reverted: ", "");
      } else if (error.error?.message) {
        reason = error.error.message.replace("execution reverted: ", "");
      }
      setStatus(`Error deleting account: ${reason || error.message}`);
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleDisconnect = () => {
    // Clear application state
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setInventory([]);
    setStatus("Wallet disconnected.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">
          Quick Actions
        </h3>
        <Button
          onClick={handleDisconnect}
          variant="outline"
          className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-200"
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
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Disconnect Wallet
        </Button>
      </div>

      <Separator className="bg-slate-700/50" />

      <div className="space-y-3">
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-400 flex items-center gap-2 mb-2">
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
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Danger Zone
          </h3>
          <p className="text-sm text-slate-400 mb-3">
            Deleting your account will release ALL your land parcels. This
            action cannot be undone.
          </p>
          <Button
            onClick={handleDeleteAccount}
            disabled={loadingDelete || !account || !contract}
            variant="destructive"
            className="w-full bg-red-900 hover:bg-red-800 border-red-800"
          >
            {loadingDelete ? (
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
                Processing...
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
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Delete Account & Release All Land
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
