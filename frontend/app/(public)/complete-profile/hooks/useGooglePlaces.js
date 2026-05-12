"use client";

import { useState, useCallback } from "react";

export function useGooglePlaces() {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getAddressSuggestions = useCallback(async (input) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/address-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const { predictions = [] } = await response.json();
      setSuggestions(predictions);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching address suggestions:", error);
      }
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const parseAddressFromPlace = useCallback(async (place) => {
    if (!place) return null;

    try {
      const addressParts = (place.formatted_address || "")
        .split(",")
        .map((p) => p.trim());

      const postcode = place.address_components?.postcode || "";

      let city =
        place.address_components?.city ||
        place.address_components?.town ||
        place.address_components?.county ||
        "";

      if (city.includes("Borough of")) {
        city = city.split("Borough of")[0].trim();
      }

      const houseNum = place.address_components?.house_number || "";
      const road = place.address_components?.road || "";
      let firstLine = [houseNum, road].filter(Boolean).join(" ");

      if (!firstLine && place.type !== "postcode" && addressParts.length > 0) {
        firstLine = addressParts[0];
      }

      return {
        firstLine,
        secondLine:
          place.address_components?.suburb ||
          place.address_components?.village ||
          "",
        city,
        postcode,
        country: place.address_components?.country || "United Kingdom",
        latitude: place.lat,
        longitude: place.lon,
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error parsing place details:", error);
      }
      return null;
    }
  }, []);

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  return {
    suggestions,
    isLoading,
    getAddressSuggestions,
    parseAddressFromPlace,
    clearSuggestions,
  };
}
