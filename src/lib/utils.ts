import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// what3words API utils
export async function convertW3WToCoordinates(w3wAddress: string) {
  try {
    // Using our API route instead of directly calling the what3words API
    const response = await fetch(
      `/api/what3words?words=${encodeURIComponent(w3wAddress)}`
    );

    if (!response.ok) {
      throw new Error("Failed to convert what3words address");
    }

    const data = await response.json();
    return {
      lat: data.coordinates.lat,
      lng: data.coordinates.lng,
      w3wAddress,
    };
  } catch (error) {
    console.error("Error converting what3words:", error);
    return null;
  }
}

// Get user's current location
export const getCurrentLocation = (): Promise<GeolocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => reject(error),
      { enableHighAccuracy: true }
    );
  });
};

// Calculate distance between two coordinates using the Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km

  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};
