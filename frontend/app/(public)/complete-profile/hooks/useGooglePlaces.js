"use client";

import { useState, useCallback } from "react";

/**
 * Custom hook for Address Autocomplete
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
export function useGooglePlaces(apiKey) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get address suggestions via Nominatim API
  const getAddressSuggestions = useCallback(
    async (input) => {
      if (!input || input.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);

      try {
        console.log("🔍 Fetching address suggestions for:", input);

        // Check if input looks like a postcode (alphanumeric, typically 6-7 chars)
        const isPostcode = /^[A-Z0-9]{2,4}\s?[A-Z0-9]{2,3}$/i.test(input.trim());

        // Build search query - if it's a postcode, search more specifically
        let searchQuery = input;
        if (isPostcode) {
          console.log("📮 Searching for postcode:", input);
        }

        // Use OpenStreetMap Nominatim API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(searchQuery)}&` +
          `countrycodes=gb&` +
          `format=json&` +
          `limit=10&` +
          `addressdetails=1`,
          {
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const results = await response.json();

        // Transform results to match our expected format
        const predictions = results.map((result) => ({
          place_id: result.place_id,
          osm_id: result.osm_id,
          osm_type: result.osm_type,
          main_text: result.name,
          secondary_text: result.address?.city || result.address?.town || result.address?.county || '',
          formatted_address: result.display_name,
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          address_components: result.address,
          type: result.type,
        }));

        console.log("✅ Got suggestions:", predictions.length);
        setSuggestions(predictions);
      } catch (error) {
        console.error("❌ Error fetching address suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Parse address and extract components from search results
  const parseAddressFromPlace = useCallback(async (place) => {
    if (!place) return null;

    try {
      console.log("📍 Parsing place details:", place);

      // Parse formatted_address to extract components
      // Format: "street, suburb/district, postcode, city, county, state, country"
      const formattedAddress = place.formatted_address || "";
      const addressParts = formattedAddress.split(",").map(part => part.trim());

      // Extract postcode (usually ends with alphanumeric pattern like N7 6EX)
      const postcode = place.address_components?.postcode || "";

      // Extract city - handle cases like "London Borough of Islington" by taking just main city
      let city = place.address_components?.city || place.address_components?.town || place.address_components?.county || place.secondary_text || "";

      // If city contains "Borough of", extract just the city part (e.g., "London" from "London Borough of Islington")
      if (city.includes("Borough of")) {
        city = city.split("Borough of")[0].trim();
      }

      // Extract first line - try to get from road, house number, or first part of formatted address
      let firstLine = place.address_components?.road || place.address_components?.house_number || "";

      // If no road/house_number, try to parse from formatted_address
      // For postcode searches, first part is often just the postcode, so look for actual addresses
      if (!firstLine && place.type !== "postcode" && addressParts.length > 0) {
        firstLine = addressParts[0];
      } else if (!firstLine && place.type === "postcode") {
        // For postcode-only results, prompt user to enter street address
        firstLine = "";
      }

      // We already have the address components from the search result
      // Extract what we need from the place object
      const addressComponents = {
        firstLine: firstLine,
        secondLine: place.address_components?.suburb || place.address_components?.village || "",
        city: city,
        postcode: postcode,
        country: place.address_components?.country || "United Kingdom",
        latitude: place.lat,
        longitude: place.lon,
      };

      console.log("✅ Place details parsed:", addressComponents);
      return addressComponents;
    } catch (error) {
      console.error("❌ Error parsing place details:", error);
      return null;
    }
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isLoading,
    getAddressSuggestions,
    parseAddressFromPlace,
    clearSuggestions,
  };
}
