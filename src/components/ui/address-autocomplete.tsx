"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Australian states
const AU_STATES = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "WA", label: "Western Australia" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NT", label: "Northern Territory" },
];

// State name to abbreviation mapping
const STATE_ABBREVIATIONS: Record<string, string> = {
  "New South Wales": "NSW",
  "Victoria": "VIC",
  "Queensland": "QLD",
  "Western Australia": "WA",
  "South Australia": "SA",
  "Tasmania": "TAS",
  "Australian Capital Territory": "ACT",
  "Northern Territory": "NT",
};

export interface AddressData {
  fullAddress: string;
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
}

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressAutocompleteProps {
  label: string;
  value: AddressData;
  onChange: (address: AddressData) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// Load Google Maps script
let googleMapsLoaded = false;
let googleMapsLoading = false;
const loadCallbacks: Array<() => void> = [];

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve) => {
    if (googleMapsLoaded) {
      resolve();
      return;
    }

    loadCallbacks.push(resolve);

    if (googleMapsLoading) {
      return;
    }

    googleMapsLoading = true;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.warn("Google Places API key not configured. Falling back to manual entry.");
      googleMapsLoaded = true;
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Define callback
    (window as unknown as { initGoogleMaps: () => void }).initGoogleMaps = () => {
      googleMapsLoaded = true;
      googleMapsLoading = false;
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };

    script.onerror = () => {
      console.error("Failed to load Google Maps script");
      googleMapsLoading = false;
      // Still resolve so component can fall back to manual mode
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };

    document.head.appendChild(script);
  });
}

export function AddressAutocomplete({
  label,
  value,
  onChange,
  placeholder = "Start typing an address...",
  required = false,
  disabled = false,
  className,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value.fullAddress || "");
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Initialize Google Places
  useEffect(() => {
    loadGoogleMapsScript().then(() => {
      if (typeof google !== "undefined" && google.maps?.places) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        // Create a dummy div for PlacesService (required but not displayed)
        const dummyDiv = document.createElement("div");
        placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        setApiAvailable(true);
      }
    });
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch address suggestions using Google Places API
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3 || !autocompleteServiceRef.current) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: searchQuery,
          componentRestrictions: { country: "au" },
          types: ["address"],
          sessionToken: sessionTokenRef.current || undefined,
        },
        (predictions, status) => {
          setIsLoading(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions as PlacePrediction[]);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        }
      );
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!manualMode && apiAvailable) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(newQuery);
      }, 300);
    }
  };

  // Handle suggestion selection - get full place details
  const handleSelectSuggestion = (suggestion: PlacePrediction) => {
    if (!placesServiceRef.current) return;

    setIsLoading(true);
    placesServiceRef.current.getDetails(
      {
        placeId: suggestion.place_id,
        fields: ["address_components", "formatted_address"],
        sessionToken: sessionTokenRef.current || undefined,
      },
      (place, status) => {
        setIsLoading(false);

        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const components = place.address_components || [];

          // Parse address components
          let streetNumber = "";
          let route = "";
          let suburb = "";
          let state = "";
          let postcode = "";

          for (const component of components) {
            const types = component.types;

            if (types.includes("street_number")) {
              streetNumber = component.long_name;
            } else if (types.includes("route")) {
              route = component.long_name;
            } else if (types.includes("locality") || types.includes("sublocality")) {
              suburb = component.long_name;
            } else if (types.includes("administrative_area_level_1")) {
              // Convert full state name to abbreviation
              state = STATE_ABBREVIATIONS[component.long_name] || component.short_name;
            } else if (types.includes("postal_code")) {
              postcode = component.long_name;
            }
          }

          const addressLine1 = [streetNumber, route].filter(Boolean).join(" ");

          const newAddress: AddressData = {
            fullAddress: place.formatted_address || suggestion.description,
            addressLine1,
            addressLine2: "",
            suburb,
            state,
            postcode,
            country: "Australia",
          };

          onChange(newAddress);
          setQuery(place.formatted_address || suggestion.description);
          setShowSuggestions(false);

          // Reset session token after selection (billing optimization)
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        }
      }
    );
  };

  // Handle manual field changes
  const handleManualChange = (field: keyof AddressData, fieldValue: string) => {
    const newAddress = { ...value, [field]: fieldValue };

    // Update full address when manual fields change
    const parts = [
      newAddress.addressLine1,
      newAddress.addressLine2,
      newAddress.suburb,
      newAddress.state,
      newAddress.postcode,
      newAddress.country,
    ].filter(Boolean);
    newAddress.fullAddress = parts.join(", ");

    onChange(newAddress);
    setQuery(newAddress.fullAddress);
  };

  // Toggle manual mode
  const toggleManualMode = () => {
    setManualMode(!manualMode);
    setShowSuggestions(false);
  };

  // Clear address
  const clearAddress = () => {
    onChange({
      fullAddress: "",
      addressLine1: "",
      addressLine2: "",
      suburb: "",
      state: "",
      postcode: "",
      country: "Australia",
    });
    setQuery("");
  };

  // If API not available, force manual mode
  const effectiveManualMode = manualMode || !apiAvailable;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`manual-${label}`}
            checked={effectiveManualMode}
            onCheckedChange={() => toggleManualMode()}
            disabled={disabled || !apiAvailable}
          />
          <Label htmlFor={`manual-${label}`} className="text-xs text-muted-foreground cursor-pointer">
            Enter manually
          </Label>
        </div>
      </div>

      {!effectiveManualMode ? (
        /* Autocomplete Mode */
        <div className="relative">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={handleInputChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder={placeholder}
              disabled={disabled}
              className="pl-10 pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              {query && !disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={clearAddress}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border rounded-lg shadow-lg overflow-hidden"
            >
              <ScrollArea className="max-h-60">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-b-0 flex items-start gap-3"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <div>
                      <span className="text-sm font-medium">{suggestion.structured_formatting.main_text}</span>
                      <span className="text-xs text-muted-foreground block">
                        {suggestion.structured_formatting.secondary_text}
                      </span>
                    </div>
                  </button>
                ))}
              </ScrollArea>
              <div className="px-3 py-2 bg-muted/50 border-t">
                <img
                  src="https://developers.google.com/static/maps/documentation/images/powered_by_google_on_white.png"
                  alt="Powered by Google"
                  className="h-4 opacity-60"
                />
              </div>
            </div>
          )}

          {/* Show parsed address preview when selected */}
          {value.addressLine1 && !showSuggestions && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div>
                  <span className="font-medium">Street:</span> {value.addressLine1}
                </div>
                <div>
                  <span className="font-medium">Suburb:</span> {value.suburb}
                </div>
                <div>
                  <span className="font-medium">State:</span> {value.state}
                </div>
                <div>
                  <span className="font-medium">Postcode:</span> {value.postcode}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Manual Entry Mode */
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          {!apiAvailable && (
            <p className="text-xs text-amber-600 mb-2">
              Address autocomplete unavailable. Please enter your address manually.
            </p>
          )}
          <div>
            <Label className="text-xs">Street Address</Label>
            <Input
              value={value.addressLine1}
              onChange={(e) => handleManualChange("addressLine1", e.target.value)}
              placeholder="123 Example Street"
              disabled={disabled}
            />
          </div>
          <div>
            <Label className="text-xs">Unit / Apartment (optional)</Label>
            <Input
              value={value.addressLine2}
              onChange={(e) => handleManualChange("addressLine2", e.target.value)}
              placeholder="Unit 4, Level 2"
              disabled={disabled}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Suburb</Label>
              <Input
                value={value.suburb}
                onChange={(e) => handleManualChange("suburb", e.target.value)}
                placeholder="Sydney"
                disabled={disabled}
              />
            </div>
            <div>
              <Label className="text-xs">State</Label>
              <Select
                value={value.state}
                onValueChange={(v) => handleManualChange("state", v)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {AU_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Postcode</Label>
              <Input
                value={value.postcode}
                onChange={(e) => handleManualChange("postcode", e.target.value)}
                placeholder="2000"
                maxLength={4}
                disabled={disabled}
              />
            </div>
            <div>
              <Label className="text-xs">Country</Label>
              <Input
                value={value.country}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dual address component with "same as residential" checkbox
interface DualAddressFieldsProps {
  residentialAddress: AddressData;
  mailingAddress: AddressData;
  mailingAddressSameAsResidential: boolean;
  onResidentialChange: (address: AddressData) => void;
  onMailingChange: (address: AddressData) => void;
  onSameAsResidentialChange: (same: boolean) => void;
  disabled?: boolean;
}

export function DualAddressFields({
  residentialAddress,
  mailingAddress,
  mailingAddressSameAsResidential,
  onResidentialChange,
  onMailingChange,
  onSameAsResidentialChange,
  disabled = false,
}: DualAddressFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Residential Address */}
      <AddressAutocomplete
        label="Residential Address"
        value={residentialAddress}
        onChange={onResidentialChange}
        placeholder="Search for Australian address..."
        disabled={disabled}
      />

      {/* Same as Residential Checkbox */}
      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
        <Checkbox
          id="same-as-residential"
          checked={mailingAddressSameAsResidential}
          onCheckedChange={(checked) => {
            onSameAsResidentialChange(checked as boolean);
            if (checked) {
              onMailingChange(residentialAddress);
            }
          }}
          disabled={disabled}
        />
        <Label htmlFor="same-as-residential" className="text-sm cursor-pointer">
          Mailing address is the same as residential address
        </Label>
      </div>

      {/* Mailing Address - only show if different */}
      {!mailingAddressSameAsResidential && (
        <AddressAutocomplete
          label="Mailing Address"
          value={mailingAddress}
          onChange={onMailingChange}
          placeholder="Search for mailing address..."
          disabled={disabled}
        />
      )}
    </div>
  );
}

// Helper to create empty address
export function createEmptyAddress(): AddressData {
  return {
    fullAddress: "",
    addressLine1: "",
    addressLine2: "",
    suburb: "",
    state: "",
    postcode: "",
    country: "Australia",
  };
}

// Helper to parse address from database format
export function parseAddressFromDb(data: {
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
}): AddressData {
  return {
    fullAddress: data.address || "",
    addressLine1: data.addressLine1 || "",
    addressLine2: data.addressLine2 || "",
    suburb: data.suburb || "",
    state: data.state || "",
    postcode: data.postcode || "",
    country: data.country || "Australia",
  };
}
