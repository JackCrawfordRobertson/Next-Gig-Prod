"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Lightbulb } from "lucide-react";
import { useJobSuggestions } from "../../hooks/useJobSuggestions";
import { useState, useRef } from "react";

export default function JobPreferences({
  jobTitles,
  jobLocations,
  jobSearch,
  locationInput,
  onJobSearchChange,
  onLocationInputChange,
  onAddJobTitle,
  onRemoveJobTitle,
  onAddJobLocation,
  onRemoveJobLocation
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const suggestions = useJobSuggestions(jobSearch);

  const handleSuggestionSelect = (suggestion) => {
    onAddJobTitle(suggestion);
    setShowSuggestions(false);
  };

  const handleJobSearchBlur = () => {
    // Delay to allow click event to fire on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 100);
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
        <Label htmlFor="location-input" className="text-xs">
          Location you want to search ({jobLocations.length}/1) <span aria-hidden="true">*</span>
        </Label>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Input
            id="location-input"
            placeholder="Type a location"
            value={locationInput}
            onChange={onLocationInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && locationInput.trim() !== "") {
                e.preventDefault();
                onAddJobLocation();
              }
            }}
            className="h-10"
            aria-required="true"
            disabled={jobLocations.length >= 1}
          />
          <Button
            type="button"
            onClick={onAddJobLocation}
            className="h-10 px-3 w-full sm:w-auto"
            aria-label="Add location"
            disabled={!locationInput.trim() || jobLocations.length >= 1}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Add 1 location you're interested in.
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