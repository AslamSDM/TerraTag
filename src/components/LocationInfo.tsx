import React, { useState, useEffect, useCallback } from "react";
import { LocationInfoProps } from "../types";
import { W3W_API_KEY } from "../config";
import { Button } from "./ui/button";

const LocationInfo: React.FC<LocationInfoProps> = ({
  currentW3W,
  setCurrentW3W,
  setStatus,
}) => {
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setStatus("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus("Getting location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        setStatus("Location found. Fetching what3words address...");
        console.log("Coords:", latitude, longitude);

        // Fetch what3words address
        try {
          const response = await fetch(
            `https://api.what3words.com/v3/convert-to-3wa?coordinates=${latitude},${longitude}&key=${W3W_API_KEY}`,
            {
              referrer: "https://developer.what3words.com/",
            }
          );
          if (!response.ok) {
            const errorData = await response.json();
            console.error("w3w API Error:", errorData);
            throw new Error(
              `what3words API error: ${
                errorData.error?.message || response.statusText
              }`
            );
          }
          const data = await response.json();
          if (data.words) {
            setCurrentW3W(data.words);
            setStatus(`Current square: ${data.words}`);
            console.log("w3w:", data.words);
          } else {
            throw new Error("Could not retrieve 3 word address.");
          }
        } catch (apiError: any) {
          console.error("Error fetching what3words:", apiError);
          setError(`Error fetching what3words: ${apiError.message}`);
          setStatus(`Error fetching what3words: ${apiError.message}`);
          setCurrentW3W(null); // Clear w3w on error
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        let message = "Error getting location.";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = "Geolocation permission denied.";
            break;
          case err.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case err.TIMEOUT:
            message = "Geolocation request timed out.";
            break;
          default:
            message = "An unknown geolocation error occurred.";
        }
        setError(message);
        setStatus(message);
        setLoading(false);
        setCurrentW3W(null); // Clear w3w on error
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Options
    );
  }, [setCurrentW3W, setStatus]); // Dependencies

  useEffect(() => {
    // Get location on initial load
    getLocation();
  }, [getLocation]); // Run once on mount

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <Button
          onClick={getLocation}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Locating...
            </>
          ) : (
            <>
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
                className="mr-2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Get Current Location
            </>
          )}
        </Button>
        {coords && (
          <div className="text-xs text-white">
            <span className="inline-flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                <path d="M2 12h20"></path>
              </svg>
              {coords.latitude.toFixed(5)},{coords.longitude.toFixed(5)}
            </span>
          </div>
        )}
      </div>

      {currentW3W && (
        <div className="bg-emerald-900/20 border border-emerald-600/30 rounded-lg p-3 text-center mb-4">
          <div className="text-sm text-white mb-1">Your current square</div>
          <div className="text-xl font-medium text-white tracking-wide">
            /// {currentW3W}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 text-center">
          <div className="text-sm text-white">{error}</div>
        </div>
      )}
    </div>
  );
};

export default LocationInfo;
