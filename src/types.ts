import { ethers } from "ethers";

export interface ConnectWalletProps {
  account: string | null;
  setAccount: (account: string | null) => void;
  setProvider: (provider: ethers.providers.Web3Provider | null) => void;
  setSigner: (signer: ethers.Signer | null) => void;
  setContract: (contract: ethers.Contract | null) => void;
}

export interface LocationInfoProps {
  currentW3W: string | null;
  setCurrentW3W: (w3w: string | null) => void;
  setStatus: (message: string) => void;
}

export interface ActionPanelProps {
  contract: ethers.Contract | null;
  account: string | null;
  currentW3W: string | null;
  refreshInventory: () => void;
  setStatus: (message: string) => void;
  inventory: string[];
}

export interface InventoryProps {
  contract: ethers.Contract | null;
  account: string | null;
  inventory: string[];
  setInventory: (inventory: string[]) => void;
  setStatus: (message: string) => void;
}

export interface SettingsProps {
  contract: ethers.Contract | null;
  account: string | null;
  setStatus: (message: string) => void;
  setAccount: (account: string | null) => void;
  setProvider: (provider: ethers.providers.Web3Provider | null) => void;
  setSigner: (signer: ethers.Signer | null) => void;
  setContract: (contract: ethers.Contract | null) => void;
  setInventory: (inventory: string[]) => void;
}

export interface StatusMessageProps {
  message: string;
}

// Types for 3D visualization
export interface LandCoordinate {
  w3wAddress: string;
  lat: number;
  lng: number;
  owner: string;
  isOwned: boolean;
}

export interface LandGridProps {
  landCoordinates: LandCoordinate[];
  currentUserLocation: GeolocationCoordinates | null;
  currentW3W: string | null;
  onSquareClick: (word: string) => void;
}

export interface LandSquareProps {
  landCoordinate: LandCoordinate;
  position: [number, number, number];
  color: string;
  isHighlighted: boolean;
  isOwned: boolean;
  distance: number;
  onClick: () => void;
}

export interface LandVisualizationProps {
  inventory: string[];
  currentW3W: string | null;
  setCurrentW3W: (word: string) => void;
  contract: ethers.Contract | null;
  account: string | null;
}
