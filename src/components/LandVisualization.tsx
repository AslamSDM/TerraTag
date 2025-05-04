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

  // Calculate height based on distance (closer = taller) and ownership
  const baseHeight = isOwned
    ? MAP_CONFIG.heightScale * 1.5
    : MAP_CONFIG.heightScale;
  const height = baseHeight * (1 / (distance + 0.5));

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

// Generate a grid of adjacent land squares
function LandGrid({
  landCoordinates,
  currentUserLocation,
  currentW3W,
  onSquareClick,
}: LandGridProps) {
  // Generate colors based on the w3w words
  const getColorFromWord = (word: string): string => {
    // If no word provided, use a default color for empty squares
    if (!word) return "#444444";

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

  // Find the center square based on current W3W if it exists in coordinates
  let centerSquare = landCoordinates.find(
    (coord) => coord.w3wAddress === currentW3W
  );

  // If currentW3W is not in our coordinates, use the first coordinate as center
  if (!centerSquare && landCoordinates.length > 0) {
    centerSquare = landCoordinates[0];
  }

  // Create a 5x5 grid of squares centered on the current/selected square
  const gridSize = 5;
  const halfGrid = Math.floor(gridSize / 2);
  const gridSquares = [];

  // Generate the grid squares
  for (let x = -halfGrid; x <= halfGrid; x++) {
    for (let z = -halfGrid; z <= halfGrid; z++) {
      // Calculate position based on grid coordinates
      const posX = x * MAP_CONFIG.squareSize;
      const posZ = z * MAP_CONFIG.squareSize;

      // Check if this grid position corresponds to one of our known coordinates
      const existingSquare = landCoordinates.find((coord) => {
        if (!centerSquare) return false;

        // Calculate the grid position of this coordinate relative to center
        const relX = Math.round(((coord.lng - centerSquare.lng) * 111000) / 3);
        const relZ = -Math.round(((coord.lat - centerSquare.lat) * 111000) / 3);

        return relX === x && relZ === z;
      });

      // If we found a match, use its data, otherwise create a placeholder square
      const squareData = existingSquare || {
        w3wAddress: "",
        lat: centerSquare ? centerSquare.lat + z * 0.00003 : 0,
        lng: centerSquare ? centerSquare.lng + x * 0.00003 : 0,
        owner: "",
        isOwned: false,
      };

      // Distance from center (for visual effects)
      const distance = Math.sqrt(x * x + z * z) * 0.1;

      // Is this the highlighted square?
      const isHighlighted = squareData.w3wAddress === currentW3W;

      gridSquares.push({
        position: [posX, 0, posZ] as [number, number, number],
        landCoordinate: squareData,
        color: getColorFromWord(squareData.w3wAddress),
        isHighlighted,
        isOwned: squareData.isOwned,
        distance,
      });
    }
  }

  return (
    <>
      {/* Ambient light and directional light for better visibility */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Grid helper aligned with our square grid */}
      <gridHelper
        args={[MAP_CONFIG.squareSize * gridSize, gridSize]}
        position={[0, -0.01, 0]}
      />

      {/* Center marker */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 32]} />
        <meshStandardMaterial color="#4285f4" />
      </mesh>

      {/* Render all grid squares */}
      {gridSquares.map((square, idx) => (
        <LandSquare
          key={`grid-${idx}`}
          landCoordinate={square.landCoordinate}
          position={square.position}
          color={square.color}
          isHighlighted={square.isHighlighted}
          isOwned={square.isOwned}
          distance={square.distance}
          onClick={() =>
            square.landCoordinate.w3wAddress &&
            onSquareClick(square.landCoordinate.w3wAddress)
          }
        />
      ))}

      {/* OrbitControls allows the user to rotate and zoom */}
      <OrbitControls target={[0, 0, 0]} maxPolarAngle={Math.PI / 2 - 0.1} />
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
    async function fetchUserLocationAndCoordinates() {
      setIsLoading(true);

      try {
        // Get user's current location
        const userCoords = await getCurrentLocation();
        setCurrentUserLocation(userCoords);

        // Convert W3W inventory to coordinates
        const coordinates: LandCoordinate[] = [];

        // Add current location if it's known
        if (currentW3W) {
          const currentCoords = await convertW3WToCoordinates(currentW3W);
          if (currentCoords) {
            coordinates.push({
              ...currentCoords,
              owner: inventory.includes(currentW3W) ? account || "" : "",
              isOwned: inventory.includes(currentW3W),
            });
          }
        }

        // Convert inventory squares to coordinates
        for (const w3wAddress of inventory) {
          if (w3wAddress === currentW3W) continue; // Skip if already added

          const coords = await convertW3WToCoordinates(w3wAddress);
          if (coords) {
            coordinates.push({
              ...coords,
              owner: account || "",
              isOwned: true,
            });
          }
        }

        console.log("Coordinates:", coordinates);
        setLandCoordinates(coordinates);
      } catch (error) {
        console.error("Error fetching location or coordinates:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserLocationAndCoordinates();
  }, [inventory, account, currentW3W]);

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

      <div className="absolute top-2 right-2 bg-black/70 p-2 rounded text-xs text-white">
        {currentW3W ? `Selected: /// ${currentW3W}` : "No square selected"}
      </div>
    </div>
  );
}
