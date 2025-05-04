"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";

// Import components
import ConnectWallet from "@/components/ConnectWallet";
import LocationInfo from "@/components/LocationInfo";
import ActionPanel from "@/components/ActionPanel";
import Inventory from "@/components/Inventory";
import Settings from "@/components/Settings";
import StatusMessage from "@/components/StatusMessage";
import LandVisualization from "@/components/LandVisualization";

// Import Shadcn UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Import configuration
import { contractAddress } from "@/config";

// --- Main App Component ---
function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [currentW3W, setCurrentW3W] = useState<string | null>(null);
  const [inventory, setInventory] = useState<string[]>([]);
  const [status, setStatus] = useState("Welcome! Please connect your wallet.");
  console.log(signer, provider, contract);
  // Memoized refresh function to pass down
  const refreshInventoryCallback = useCallback(() => {
    if (contract && account) {
      console.log("Refreshing inventory...", account);
      setStatus("Refreshing inventory...");
      contract
        .getUserInventory(account)
        .then((ownedSquares: string[]) => {
          setInventory(ownedSquares);
          setStatus("Inventory refreshed.");
        })
        .catch((error: Error) => {
          console.error("Error refreshing inventory:", error);
          setStatus(`Error refreshing inventory: ${error.message}`);
        });
    }
  }, [contract, account]); // Dependencies: Recreate only if contract or account changes

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-2 bg-clip-text text-white">
            TerraTag
          </h1>
          <p className="text-white max-w-md mx-auto">
            Claim and manage virtual land parcels on the blockchain
          </p>
        </header>

        {/* Wallet Connection Section */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="pt-6">
            <ConnectWallet
              account={account}
              setAccount={setAccount}
              setProvider={setProvider}
              setSigner={setSigner}
              setContract={setContract}
            />
          </CardContent>
        </Card>

        {/* Three.js Visualization (Only if inventory has items) */}
        {inventory.length > 0 && (
          <Card className="mb-6 bg-slate-800/50 border-slate-700 overflow-hidden">
            <CardHeader>
              <CardTitle>Land Visualization</CardTitle>
              <CardDescription className="text-white">
                3D view of your owned land squares
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LandVisualization
                inventory={inventory}
                currentW3W={currentW3W}
                setCurrentW3W={setCurrentW3W}
                contract={contract}
                account={account}
              />
            </CardContent>
            <CardFooter className="text-xs text-white">
              Tip: Click on a square to select it, drag to rotate view
            </CardFooter>
          </Card>
        )}

        {/* Grid Layout for Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Location & Actions */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle>Location</CardTitle>
                <CardDescription className="text-white">
                  Find and select land parcels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LocationInfo
                  currentW3W={currentW3W}
                  setCurrentW3W={setCurrentW3W}
                  setStatus={setStatus}
                />
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle>Actions</CardTitle>
                <CardDescription className="text-white">
                  Claim, mint and manage land
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActionPanel
                  contract={contract}
                  account={account}
                  currentW3W={currentW3W}
                  refreshInventory={refreshInventoryCallback}
                  setStatus={setStatus}
                  inventory={inventory}
                />
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Inventory & Settings */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle>Inventory</CardTitle>
                <CardDescription className="text-white">
                  Your owned land parcels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Inventory
                  contract={contract}
                  account={account}
                  inventory={inventory}
                  setInventory={setInventory}
                  setStatus={setStatus}
                />
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle>Settings</CardTitle>
                <CardDescription className="text-white">
                  Configure your account and application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Settings
                  contract={contract}
                  account={account}
                  setStatus={setStatus}
                  setAccount={setAccount}
                  setProvider={setProvider}
                  setSigner={setSigner}
                  setContract={setContract}
                  setInventory={setInventory}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status Message Display */}
        <div className="mt-8">
          <StatusMessage message={status} />
        </div>

        {/* Footer/Info */}
        <footer className="mt-12 text-center">
          <Separator className="mb-6 bg-slate-700" />

          <div className="text-sm text-white">
            <p className="mb-2">
              Ensure you are connected to the Polygon network (or the network
              where the contract is deployed).
            </p>
            <p className="mb-2 font-mono text-xs">
              Contract Address:{" "}
              <span className="text-white">{contractAddress}</span>
            </p>
            <p className="text-xs flex items-center justify-center gap-1">
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
                className="lucide lucide-alert-circle"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Requires MetaMask or a similar Web3 wallet.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
