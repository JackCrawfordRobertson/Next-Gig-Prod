"use client";

import { useState, useCallback, useRef } from "react";

export function useCitySearch() {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef(null);

  const searchCities = useCallback((query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/city-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const { cities = [] } = await response.json();
        setSuggestions(cities);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("City search error:", error);
        }
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);
  }, []);

  const clearSuggestions = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSuggestions([]);
  }, []);

  return { suggestions, isLoading, searchCities, clearSuggestions };
}
