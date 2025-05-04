import React, { useCallback, useState, useEffect } from "react";
import { ethers } from "ethers";
import { ConnectWalletProps } from "../types";
import {
  contractAddress,
  contractAbi,
  checkContractCompatibility,
  NETWORK,
} from "../config";
import { Button } from "./ui/button";

const ConnectWallet: React.FC<ConnectWalletProps> = ({
  account,
  setAccount,
  setProvider,
  setSigner,
  setContract,
}) => {
  const [networkInfo, setNetworkInfo] = useState<{
    chainId: string;
    name: string;
    isCorrect: boolean;
  } | null>(null);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);

  // Check current network and update UI
  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const chainIdHex = await window.ethereum.request({
        method: "eth_chainId",
      });
      const chainIdDec = parseInt(chainIdHex, 16);

      // Get network name from our config or use a generic name
      const networkName =
        NETWORK.SUPPORTED_NETWORKS[
          chainIdHex as keyof typeof NETWORK.SUPPORTED_NETWORKS
        ]?.name || `Network #${chainIdDec}`;

      setNetworkInfo({
        chainId: chainIdHex,
        name: networkName,
        isCorrect: chainIdDec === NETWORK.REQUIRED.chainId,
      });

      return {
        chainIdHex,
        chainIdDec,
        isCorrect: chainIdDec === NETWORK.REQUIRED.chainId,
      };
    } catch (error) {
      console.error("Error checking network:", error);
      return null;
    }
  }, []);

  // Switch network function that can be called independently
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return false;

    setIsNetworkSwitching(true);

    try {
      // Try to switch to the correct network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK.REQUIRED.chainIdHex }],
      });
      console.log(`Switched to ${NETWORK.REQUIRED.name}`);

      // Check network again to update UI
      await checkNetwork();
      setIsNetworkSwitching(false);
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: NETWORK.REQUIRED.chainIdHex,
                chainName: NETWORK.REQUIRED.name,
                rpcUrls: NETWORK.REQUIRED.rpcUrls,
                nativeCurrency: NETWORK.REQUIRED.currency,
                blockExplorerUrls: NETWORK.REQUIRED.blockExplorerUrls,
              },
            ],
          });

          // Check if switch was successful
          await checkNetwork();
          setIsNetworkSwitching(false);
          return true;
        } catch (addError) {
          console.error("Failed to add the network:", addError);
          alert(
            `Failed to add ${NETWORK.REQUIRED.name}. Please add it manually in your wallet.`
          );
          setIsNetworkSwitching(false);
          return false;
        }
      } else {
        console.error("Failed to switch network:", switchError);
        alert(
          `Failed to switch to ${NETWORK.REQUIRED.name}. Please try switching manually in your wallet.`
        );
        setIsNetworkSwitching(false);
        return false;
      }
    }
  }, [checkNetwork]);

  // Initialize web3 connection with proper network checks
  const initializeWeb3 = useCallback(
    async (currentAccount: string) => {
      // Get provider
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);

      // Check if we're on the correct network
      const networkStatus = await checkNetwork();
      if (!networkStatus) return false;

      if (!networkStatus.isCorrect) {
        const switched = await switchNetwork();
        if (!switched) return false;

        // Refresh provider after network switch
        const updatedProvider = new ethers.providers.Web3Provider(
          window.ethereum
        );
        const updatedSigner = updatedProvider.getSigner();

        setupContractAndAccount(currentAccount, updatedProvider, updatedSigner);
      } else {
        // We're on the correct network
        const web3Signer = web3Provider.getSigner();
        setupContractAndAccount(currentAccount, web3Provider, web3Signer);
      }

      return true;
    },
    [checkNetwork, switchNetwork]
  );

  // Helper function to set up contract and account
  const setupContractAndAccount = async (
    currentAccount: string,
    provider: ethers.providers.Web3Provider,
    signer: ethers.Signer
  ) => {
    setAccount(currentAccount);
    setProvider(provider);
    setSigner(signer);

    // Load contract
    const landContract = new ethers.Contract(
      contractAddress,
      contractAbi,
      signer
    );

    // Check if the contract exists and is compatible
    try {
      const code = await provider.getCode(contractAddress);
      if (code === "0x") {
        console.error("No contract found at address:", contractAddress);
        alert(
          `No contract found at the specified address (${contractAddress}). Please check your configuration.`
        );
        return;
      }

      // Check contract compatibility
      const compatibility = await checkContractCompatibility(landContract);
      if (!compatibility.compatible) {
        console.warn("Contract missing required functions:", compatibility);
        alert(
          `Warning: The contract at ${contractAddress} might not be fully compatible. Some functions may not work correctly.`
        );
      } else {
        console.log("Contract is fully compatible");
      }

      setContract(landContract);
    } catch (contractError: any) {
      console.error("Error verifying contract:", contractError);
      alert(`Error verifying contract: ${contractError.message}`);
      // Still set the contract, but with a warning
      setContract(landContract);
    }
  };

  const connectWalletHandler = useCallback(async () => {
    if (window.ethereum) {
      try {
        // Request account access
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const currentAccount = accounts[0];

        // Initialize provider, signer, and contract with proper network checks
        await initializeWeb3(currentAccount);

        console.log("Wallet connected:", currentAccount);

        // Listen for account changes
        window.ethereum.on("accountsChanged", (newAccounts: string[]) => {
          if (newAccounts.length > 0) {
            initializeWeb3(newAccounts[0]);
            console.log("Account changed:", newAccounts[0]);
          } else {
            // Handle disconnection
            setAccount(null);
            setProvider(null);
            setSigner(null);
            setContract(null);
            console.log("Wallet disconnected");
          }
        });

        // Listen for chain changes
        window.ethereum.on("chainChanged", async (_chainId: string) => {
          // Check if the new chain is correct
          const network = await checkNetwork();

          if (network && network.isCorrect && currentAccount) {
            // If we're on the correct network and have an account, re-initialize
            initializeWeb3(currentAccount);
          } else {
            // Otherwise reset state and user will need to reconnect
            setAccount(null);
            setProvider(null);
            setSigner(null);
            setContract(null);
          }
        });
      } catch (error: any) {
        console.error("Error connecting wallet:", error);
        alert(`Error connecting wallet: ${error.message || error}`);
      }
    } else {
      alert("Please install MetaMask!");
    }
  }, [initializeWeb3, checkNetwork]);

  // Check network on component mount and whenever wallet/ethereum state changes
  useEffect(() => {
    if (window.ethereum && account) {
      checkNetwork();

      // Re-check network when the window regains focus
      const handleFocus = () => checkNetwork();
      window.addEventListener("focus", handleFocus);
      return () => window.removeEventListener("focus", handleFocus);
    }
  }, [account, checkNetwork]);

  // Get network styling from our config
  const getNetworkStyle = (chainId: string) => {
    const networkConfig =
      NETWORK.SUPPORTED_NETWORKS[
        chainId as keyof typeof NETWORK.SUPPORTED_NETWORKS
      ];
    if (!networkConfig) {
      return {
        color: "text-gray-400",
        bgColor: "bg-gray-800/30",
        borderColor: "border-gray-700",
        icon: "⚪",
      };
    }
    return networkConfig;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      {account ? (
        <div className="w-full">
          <div className="flex items-center justify-between gap-2 bg-slate-700/50 rounded-lg p-3 border border-emerald-600/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Wallet Connected</p>
                <p className="text-sm text-white truncate max-w-[240px] md:max-w-[320px]">
                  {account}
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {/* Network indicator */}
              {networkInfo && (
                <div
                  className={`px-3 py-1 rounded-full text-xs flex items-center gap-1.5 
                  ${
                    networkInfo.isCorrect
                      ? getNetworkStyle(networkInfo.chainId).bgColor +
                        " text-white"
                      : "bg-red-900/30 text-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  {networkInfo.name}
                </div>
              )}

              {/* Network switch button - Only show if on wrong network */}
              {networkInfo && !networkInfo.isCorrect && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchNetwork}
                  disabled={isNetworkSwitching}
                  className="border-amber-600/30 text-white hover:bg-amber-900/20 hover:text-white text-xs"
                >
                  {isNetworkSwitching ? (
                    <>
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
                      Switching...
                    </>
                  ) : (
                    <>Switch to {NETWORK.REQUIRED.name.split(" ")[0]}</>
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="border-emerald-600/30 text-white hover:bg-emerald-900/20 hover:text-white"
                onClick={() => {
                  // Use the correct block explorer based on the current network
                  const explorerUrl = "https://mumbai.polygonscan.com/";

                  window.open(`${explorerUrl}address/${account}`, "_blank");
                }}
              >
                View on Explorer
              </Button>
            </div>
          </div>

          {/* Show warning if on wrong network - visible on all screen sizes */}
          {networkInfo && !networkInfo.isCorrect && (
            <div className="mt-2 p-2 bg-amber-900/20 border border-amber-800/30 rounded-md text-white text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
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
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>
                  Wrong network detected. Please connect to{" "}
                  {NETWORK.REQUIRED.name}.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={switchNetwork}
                disabled={isNetworkSwitching}
                className="border-amber-600/30 text-white hover:bg-amber-900/20 hover:text-white text-xs py-1 h-auto md:hidden"
              >
                {isNetworkSwitching ? "Switching..." : "Switch"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full text-center md:text-left">
          <h3 className="text-xl font-semibold mb-2 text-white">
            Connect Your Wallet
          </h3>
          <p className="text-white mb-4">
            Connect your wallet to start managing your virtual land
          </p>

          <Button
            onClick={connectWalletHandler}
            className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-medium"
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
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
            </svg>
            Connect Wallet
          </Button>

          <div className="mt-4 text-xs text-white">
            Required network:{" "}
            <span className="text-white">{NETWORK.REQUIRED.name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;
