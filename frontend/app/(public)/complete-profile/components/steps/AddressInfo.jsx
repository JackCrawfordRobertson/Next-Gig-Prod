"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useGooglePlaces } from "../../hooks/useGooglePlaces";
import { useState, useRef } from "react";
import { MapPin, Loader2, X } from "lucide-react";

export default function AddressInfo({
  address,
  onAddressChange
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autocompleteInput, setAutocompleteInput] = useState("");
  const suggestionsRef = useRef(null);
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  const { suggestions, isLoading, getAddressSuggestions, parseAddressFromPlace, clearSuggestions } =
    useGooglePlaces(googleApiKey);

  const handleAddressInput = async (value) => {
    setAutocompleteInput(value);
    if (value.length >= 2) {
      setShowSuggestions(true);
      await getAddressSuggestions(value);
    } else {
      clearSuggestions();
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = async (suggestion) => {
    const addressData = await parseAddressFromPlace(suggestion);
    if (addressData) {
      // Auto-populate all address fields from the search result
      onAddressChange("firstLine", addressData.firstLine);
      onAddressChange("secondLine", addressData.secondLine);
      onAddressChange("city", addressData.city);
      onAddressChange("postcode", addressData.postcode);
      setShowSuggestions(false);
    }
    setAutocompleteInput("");
    clearSuggestions();
  };

  const handleClearSuggestions = () => {
    setShowSuggestions(false);
    setAutocompleteInput("");
    clearSuggestions();
  };

  return (
    <div className="space-y-4" aria-labelledby="address-info-heading">
      <h2 id="address-info-heading" className="sr-only">Address Information</h2>

      {/* Google Places Autocomplete Section */}
      <div className="relative">
        <Label htmlFor="address-autocomplete" className="text-xs">
          Find Your Address <span className="text-muted-foreground">(Recommended)</span>
        </Label>
        <div className="relative mt-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
          </div>
          <Input
            id="address-autocomplete"
            placeholder="Start typing your address (e.g., '10 Downing Street, London')"
            value={autocompleteInput}
            onChange={(e) => handleAddressInput(e.target.value)}
            onFocus={() => autocompleteInput && setShowSuggestions(true)}
            className="pl-9"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls="address-suggestions"
          />
          {autocompleteInput && (
            <button
              type="button"
              onClick={handleClearSuggestions}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear address input"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (suggestions.length > 0 || isLoading) && (
          <div
            ref={suggestionsRef}
            id="address-suggestions"
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
            role="listbox"
          >
            {isLoading && (
              <div className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching for addresses...
              </div>
            )}

            {!isLoading && suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-accent focus:bg-accent focus:outline-none transition-colors text-sm"
                role="option"
                aria-selected={false}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">
                      {suggestion.main_text}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {suggestion.secondary_text}
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {!isLoading && suggestions.length === 0 && autocompleteInput && (
              <div className="p-3 text-sm text-muted-foreground text-center">
                No addresses found. Try a different search.
              </div>
            )}
          </div>
        )}
      </div>


      {/* Address Entry Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="address-line1" className="text-xs flex items-center gap-1">
            Address Line 1 <span aria-hidden="true">*</span>
            {address.firstLine && <span className="text-green-600 text-xs">✓</span>}
          </Label>
          <Input
            id="address-line1"
            placeholder="Street address"
            value={address.firstLine}
            onChange={(e) => onAddressChange("firstLine", e.target.value)}
            aria-required="true"
            autoComplete="address-line1"
            className={address.firstLine ? "bg-green-50 border-green-200" : "border-red-300 focus:border-red-500"}
          />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="address-line2" className="text-xs flex items-center gap-1">
            Address Line 2 <span className="text-muted-foreground">(Optional)</span>
            {address.secondLine && <span className="text-green-600 text-xs">✓</span>}
          </Label>
          <Input
            id="address-line2"
            placeholder="Flat, unit, building, etc. (optional)"
            value={address.secondLine}
            onChange={(e) => onAddressChange("secondLine", e.target.value)}
            autoComplete="address-line2"
            className={address.secondLine ? "bg-green-50 border-green-200" : ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="city" className="text-xs flex items-center gap-1">
            City <span aria-hidden="true">*</span>
            {address.city && <span className="text-green-600 text-xs">✓</span>}
          </Label>
          <Input
            id="city"
            placeholder="City or town"
            value={address.city}
            onChange={(e) => onAddressChange("city", e.target.value)}
            aria-required="true"
            autoComplete="address-level2"
            className={address.city ? "bg-green-50 border-green-200" : "border-red-300 focus:border-red-500"}
          />
        </div>
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="postcode" className="text-xs flex items-center gap-1">
            Postcode <span aria-hidden="true">*</span>
            {address.postcode && <span className="text-green-600 text-xs">✓</span>}
          </Label>
          <Input
            id="postcode"
            placeholder="Postcode"
            value={address.postcode}
            onChange={(e) => onAddressChange("postcode", e.target.value)}
            aria-required="true"
            autoComplete="postal-code"
            className={address.postcode ? "bg-green-50 border-green-200" : "border-red-300 focus:border-red-500"}
          />
        </div>
      </div>
    </div>
  );
}