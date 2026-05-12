"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Lightbulb, MapPin, Loader2 } from "lucide-react";
import { useJobSuggestions } from "../../hooks/useJobSuggestions";
import { useCitySearch } from "../../hooks/useCitySearch";
import { useState, useRef } from "react";

export default function JobPreferences({
  jobTitles,
  jobLocations,
  jobSearch,
  onJobSearchChange,
  onAddJobTitle,
  onRemoveJobTitle,
  onAddJobLocation,
  onRemoveJobLocation
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const suggestionsRef = useRef(null);
  const citySuggestionsRef = useRef(null);
  const suggestions = useJobSuggestions(jobSearch);
  const { suggestions: citySuggestions, isLoading: cityLoading, searchCities, clearSuggestions: clearCitySuggestions } = useCitySearch();

  const handleSuggestionSelect = (suggestion) => {
    onAddJobTitle(suggestion);
    setShowSuggestions(false);
  };

  const handleJobSearchBlur = () => {
    setTimeout(() => setShowSuggestions(false), 100);
  };

  const handleCityInput = (value) => {
    setCityInput(value);
    if (value.length >= 2) {
      setShowCitySuggestions(true);
      searchCities(value);
    } else {
      clearCitySuggestions();
      setShowCitySuggestions(false);
    }
  };

  const handleCitySelect = (city) => {
    onAddJobLocation(city.display);
    setCityInput("");
    clearCitySuggestions();
    setShowCitySuggestions(false);
  };

  const handleCityBlur = () => {
    setTimeout(() => setShowCitySuggestions(false), 150);
  };
  return (
    <div className="space-y-4" aria-labelledby="job-preferences-heading">
      <h2 id="job-preferences-heading" className="sr-only">Job Preferences</h2>
      
      {/* Job Titles */}
      <div>
        <Label htmlFor="job-search" className="text-xs">
          Job titles you want to search ({jobTitles.length}/3) <span aria-hidden="true">*</span>
        </Label>
        <div className="relative">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Input
              id="job-search"
              placeholder="Type a job title (e.g., 'Developer', 'Manager')"
              value={jobSearch}
              onChange={(e) => {
                onJobSearchChange(e);
                setShowSuggestions(true);
              }}
              onFocus={() => jobSearch && setShowSuggestions(true)}
              onBlur={handleJobSearchBlur}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === "Tab") && jobSearch.trim() !== "") {
                  e.preventDefault();
                  onAddJobTitle(jobSearch);
                }
              }}
              className="h-10"
              aria-required="true"
              aria-describedby="job-titles-hint"
              aria-autocomplete="list"
              aria-expanded={showSuggestions && suggestions.length > 0}
              aria-controls="job-suggestions"
            />
            <Button
              type="button"
              onClick={() => onAddJobTitle(jobSearch)}
              className="h-10 px-3 w-full sm:w-auto"
              aria-label="Add job title"
              disabled={!jobSearch.trim() || jobTitles.length >= 3}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              id="job-suggestions"
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
              role="listbox"
            >
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-accent focus:bg-accent focus:outline-none transition-colors text-sm flex items-center gap-2"
                  role="option"
                  aria-selected={false}
                  type="button"
                >
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <p id="job-titles-hint" className="text-xs text-muted-foreground mt-1">
          Add up to 3 job titles you're interested in. We'll suggest titles as you type!
        </p>
        
        <div 
          className="flex flex-wrap gap-1 mt-2"
          aria-label={`Selected job titles: ${jobTitles.join(", ")}`}
        >
          {jobTitles.map((title) => (
            <div
              key={title}
              className="flex items-center space-x-1 bg-secondary px-2 py-0.5 rounded text-xs"
            >
              <span>{title}</span>
              <button 
                type="button" 
                onClick={() => onRemoveJobTitle(title)}
                aria-label={`Remove ${title}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Job Locations */}
      <div>
        <Label htmlFor="city-search" className="text-xs">
          Location you want to search ({jobLocations.length}/1) <span aria-hidden="true">*</span>
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <MapPin className="h-4 w-4" />
          </div>
          <Input
            id="city-search"
            placeholder={jobLocations.length >= 1 ? "Location selected" : "Search for a city (e.g. 'London', 'New York')"}
            value={cityInput}
            onChange={(e) => handleCityInput(e.target.value)}
            onFocus={() => cityInput && setShowCitySuggestions(true)}
            onBlur={handleCityBlur}
            className="pl-9 h-10"
            aria-required="true"
            aria-autocomplete="list"
            aria-expanded={showCitySuggestions && citySuggestions.length > 0}
            aria-controls="city-suggestions"
            disabled={jobLocations.length >= 1}
          />
          {cityInput && !jobLocations.length && (
            <button
              type="button"
              onClick={() => { setCityInput(""); clearCitySuggestions(); setShowCitySuggestions(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear city search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {showCitySuggestions && (citySuggestions.length > 0 || cityLoading) && (
            <div
              ref={citySuggestionsRef}
              id="city-suggestions"
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-md shadow-lg z-50 max-h-52 overflow-y-auto"
              role="listbox"
            >
              {cityLoading && (
                <div className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching cities...
                </div>
              )}
              {!cityLoading && citySuggestions.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleCitySelect(city)}
                  className="w-full text-left px-3 py-2 hover:bg-accent focus:bg-accent focus:outline-none transition-colors text-sm flex items-center gap-2"
                  role="option"
                  aria-selected={false}
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="font-medium">{city.name}</span>
                    {city.country && (
                      <span className="text-muted-foreground text-xs ml-1">{city.country}</span>
                    )}
                  </div>
                </button>
              ))}
              {!cityLoading && citySuggestions.length === 0 && cityInput.length >= 2 && (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No cities found. Try a different search.
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Search and select 1 city. Must be a specific city, not a country or region.
        </p>

        <div
          className="flex flex-wrap gap-1 mt-2"
          aria-label={`Selected locations: ${jobLocations.join(", ")}`}
        >
          {jobLocations.map((loc) => (
            <div
              key={loc}
              className="flex items-center space-x-1 bg-secondary px-2 py-0.5 rounded text-xs"
            >
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{loc}</span>
              <button
                type="button"
                onClick={() => onRemoveJobLocation(loc)}
                aria-label={`Remove ${loc}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}