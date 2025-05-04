import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Box } from "@react-three/drei";
import * as THREE from "three";
import {
  LandVisualizationProps,
  LandGridProps,
  LandSquareProps,
  LandCoordinate,
} from "../types";
import {
  convertW3WToCoordinates,
  getCurrentLocation,
  calculateDistance,
} from "../lib/utils";
import { MAP_CONFIG } from "../config";

// Individual square representation in 3D space
function LandSquare({
  landCoordinate,
  position,
  color,
  isHighlighted,
  isOwned,
  distance,
  onClick,
}: LandSquareProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Calculate height based on distance (closer = taller)
  const height = MAP_CONFIG.heightScale * (1 / (distance + 0.5));

  // Handle hover animation
  useFrame(() => {
    if (meshRef.current) {
      if (hovered || isHighlighted) {
        meshRef.current.position.y = THREE.MathUtils.lerp(
          meshRef.current.position.y,
          position[1] + 0.2,
          0.1
        );
      } else {
        meshRef.current.position.y = THREE.MathUtils.lerp(
          meshRef.current.position.y,
          position[1],
          0.1
        );
      }
    }
  });

  return (
    <group>
      <Box
        ref={meshRef}
        position={position}
        args={[MAP_CONFIG.squareSize, height, MAP_CONFIG.squareSize]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={hovered || isHighlighted ? "#ffffff" : color}
          metalness={0.5}
          roughness={0.2}
          opacity={isOwned ? 1 : 0.6}
          transparent={!isOwned}
        />
      </Box>

      <Text
        position={[position[0], position[1] + height / 2 + 0.1, position[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {landCoordinate.w3wAddress}
      </Text>

      {isOwned && (
        <mesh
          position={[position[0], position[1] + height / 2 + 0.05, position[2]]}
        >
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
      )}
    </group>
  );
}

// Grid of land squares with coordinate mapping
function LandGrid({
  landCoordinates,
  currentUserLocation,
  currentW3W,
  onSquareClick,
}: LandGridProps) {
  // Generate colors based on the w3w words
  const getColorFromWord = (word: string): string => {
    // Simple hash function to convert string to color
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = word.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert to hex color
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).substr(-2);
    }
    return color;
  };

  if (!currentUserLocation || landCoordinates.length === 0) {
    return (
      <>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <gridHelper args={[20, 20]} />
        <Text position={[0, 0.5, 0]} fontSize={0.5} color="#ffffff">
          Loading coordinates...
        </Text>
        <OrbitControls />
      </>
    );
  }

  // Map coordinates to relative 3D space
  // The center (0,0,0) is the user's current location
  return (
    <>
      {/* Ambient light and directional light for better visibility */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Grid helper */}
      <gridHelper args={[20, 20]} />

      {/* User's current position marker */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
        <meshStandardMaterial color="#4285f4" />
      </mesh>

      {/* Land squares from inventory and nearby */}
      {landCoordinates.map((landCoord) => {
        // Calculate the distance from user to this coordinate
        const distanceKm = currentUserLocation
          ? calculateDistance(
              currentUserLocation.latitude,
              currentUserLocation.longitude,
              landCoord.lat,
              landCoord.lng
            )
          : 999; // Default large distance if location unknown

        // Calculate relative position:
        // We need to transform lat/lng differences to X/Z coordinates
        // Assuming flat projection for simplicity in a small area
        const scale = 10; // Scale factor for coordinate differences

        // Calculate relative position (lat/lng delta from current position)
        const posX =
          (landCoord.lng - currentUserLocation.longitude) * scale * 111;
        const posZ =
          -(landCoord.lat - currentUserLocation.latitude) * scale * 111;

        // Height can be based on ownership or other factors
        const posY = 0;

        const position: [number, number, number] = [posX, posY, posZ];
        const color = getColorFromWord(landCoord.w3wAddress);
        const isHighlighted = landCoord.w3wAddress === currentW3W;

        return (
          <LandSquare
            key={landCoord.w3wAddress}
            landCoordinate={landCoord}
            position={position}
            color={color}
            isHighlighted={isHighlighted}
            isOwned={landCoord.isOwned}
            distance={distanceKm}
            onClick={() => onSquareClick(landCoord.w3wAddress)}
          />
        );
      })}

      {/* OrbitControls allows the user to rotate and zoom */}
      <OrbitControls target={[0, 0, 0]} />
    </>
  );
}

// Main component
export default function LandVisualization({
  inventory,
  currentW3W,
  setCurrentW3W,
  account,
}: LandVisualizationProps) {
  const [landCoordinates, setLandCoordinates] = useState<LandCoordinate[]>([]);
  const [currentUserLocation, setCurrentUserLocation] =
    useState<GeolocationCoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get user's current location and convert inventory to coordinates
  useEffect(() => {
    console.log("asds");
    async function fetchUserLocationAndCoordinates() {
      setIsLoading(true);

      try {
        // Get user's current location
        const userCoords = await getCurrentLocation();
        setCurrentUserLocation(userCoords);

        // Convert W3W inventory to coordinates
        const coordinates: LandCoordinate[] = [];

        // Convert inventory squares to coordinates
        for (const w3wAddress of inventory) {
          const coords = await convertW3WToCoordinates(w3wAddress);

          if (coords) {
            coordinates.push({
              ...coords,
              owner: "account",
              isOwned: true,
            });
          }
        }
        console.log("Coordinates:", coordinates);
        // TODO Mark the inventory squares as owned

        setLandCoordinates(coordinates);
      } catch (error) {
        console.error("Error fetching location or coordinates:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserLocationAndCoordinates();
  }, [inventory, account]);

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-200 shadow-inner relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
          <div className="bg-black/70 p-4 rounded-lg text-white">
            <p>Loading map and coordinates...</p>
          </div>
        </div>
      )}

      <Canvas camera={{ position: [0, 5, 5], fov: 60 }}>
        <LandGrid
          landCoordinates={landCoordinates}
          currentUserLocation={currentUserLocation}
          currentW3W={currentW3W}
          onSquareClick={(word) => setCurrentW3W(word)}
        />
      </Canvas>

      <div className="absolute bottom-2 left-2 bg-black/70 p-2 rounded text-xs text-white">
        {currentUserLocation
          ? `Your location: ${currentUserLocation.latitude.toFixed(
              6
            )}, ${currentUserLocation.longitude.toFixed(6)}`
          : "Getting your location..."}
      </div>
    </div>
  );
}
