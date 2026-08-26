import {
  isAustralianPhotonFeature,
  parseGoogleAddressComponents,
  parseNominatimAddress,
  parsePhotonProperties,
  type NominatimAddress,
  type PhotonAddressProperties,
} from "@/lib/address/parse";
import type {
  AddressLookupProvider,
  AddressSuggestion,
  GoogleAddressComponent,
  ParsedAustralianAddress,
} from "@/lib/address/types";

const PHOTON_ENDPOINT = "https://photon.komoot.io/api/";
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const GOOGLE_AUTOCOMPLETE_ENDPOINT = "https://places.googleapis.com/v1/places:autocomplete";
const GOOGLE_PLACE_ENDPOINT = "https://places.googleapis.com/v1/places";
const USER_AGENT = "SanativeHealth/1.0 (address-lookup)";
const LOOKUP_TIMEOUT_MS = 4000;

export function getGooglePlacesApiKey(): string | null {
  const key =
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    "";
  return key || null;
}

function abortAfter(ms: number): AbortSignal {
  return AbortSignal.timeout(ms);
}

type GoogleAutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      place?: string;
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
      text?: { text?: string };
    };
  }>;
  error?: { message?: string; status?: string; code?: number };
};

type GooglePlaceDetailsResponse = {
  id?: string;
  formattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  error?: { message?: string; status?: string; code?: number };
};

type PhotonResponse = {
  features?: Array<{
    properties?: PhotonAddressProperties;
  }>;
};

export async function suggestAustralianAddresses(
  query: string,
  sessionToken?: string
): Promise<{ suggestions: AddressSuggestion[]; source: AddressLookupProvider }> {
  const googleKey = getGooglePlacesApiKey();
  if (googleKey) {
    try {
      const suggestions = await suggestGoogle(query, googleKey, sessionToken);
      return { suggestions, source: "google" };
    } catch (error) {
      console.warn("Google Places autocomplete failed, using fallback lookup", error);
    }
  }

  return { suggestions: await suggestFallback(query), source: "photon" };
}

export async function getAustralianAddressDetails(
  id: string,
  provider: AddressLookupProvider,
  sessionToken?: string
): Promise<ParsedAustralianAddress | null> {
  if (provider === "google") {
    const googleKey = getGooglePlacesApiKey();
    if (!googleKey) return null;
    return getGooglePlaceDetails(id, googleKey, sessionToken);
  }
  return null;
}

async function suggestGoogle(
  query: string,
  apiKey: string,
  sessionToken?: string
): Promise<AddressSuggestion[]> {
  const res = await fetch(GOOGLE_AUTOCOMPLETE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: ["au"],
      languageCode: "en-AU",
      regionCode: "AU",
      ...(sessionToken ? { sessionToken } : {}),
    }),
    signal: abortAfter(LOOKUP_TIMEOUT_MS),
  });

  const data = (await res.json()) as GoogleAutocompleteResponse;
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Google Places autocomplete failed (${res.status})`);
  }

  const suggestions: AddressSuggestion[] = [];
  for (const item of data.suggestions ?? []) {
    const prediction = item.placePrediction;
    const id = prediction?.placeId || prediction?.place?.replace(/^places\//, "") || "";
    const primary =
      prediction?.structuredFormat?.mainText?.text || prediction?.text?.text || "";
    const secondary = prediction?.structuredFormat?.secondaryText?.text || "";
    if (!id || !primary) continue;
    suggestions.push({ id, provider: "google", primary, secondary });
    if (suggestions.length >= 6) break;
  }
  return suggestions;
}

async function getGooglePlaceDetails(
  placeId: string,
  apiKey: string,
  sessionToken?: string
): Promise<ParsedAustralianAddress | null> {
  const cleanId = placeId.replace(/^places\//, "");
  const url = new URL(`${GOOGLE_PLACE_ENDPOINT}/${encodeURIComponent(cleanId)}`);
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,formattedAddress,addressComponents",
    },
    signal: abortAfter(LOOKUP_TIMEOUT_MS),
  });

  const data = (await res.json()) as GooglePlaceDetailsResponse;
  if (!res.ok || data.error || !data.addressComponents?.length) {
    throw new Error(data.error?.message || `Google Place details failed (${res.status})`);
  }

  return parseGoogleAddressComponents(data.addressComponents, data.formattedAddress);
}

async function suggestFallback(query: string): Promise<AddressSuggestion[]> {
  try {
    const photon = await suggestPhoton(query);
    if (photon.length > 0) return photon;
  } catch (error) {
    console.warn("Photon address lookup failed, using Nominatim", error);
  }
  return suggestNominatim(query);
}

async function suggestPhoton(query: string): Promise<AddressSuggestion[]> {
  const url = new URL(PHOTON_ENDPOINT);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  url.searchParams.set("lang", "en");
  url.searchParams.set("bbox", "112.9,-43.8,153.7,-10.0");

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: abortAfter(LOOKUP_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Address lookup failed (${res.status})`);
  }

  const data = (await res.json()) as PhotonResponse;
  const seen = new Set<string>();
  const suggestions: AddressSuggestion[] = [];

  for (const feature of data.features ?? []) {
    const properties = feature.properties;
    if (!properties || !isAustralianPhotonFeature(properties)) continue;
    const parsed = parsePhotonProperties(properties);
    if (!parsed.addressLine1) continue;
    const id = `photon:${properties.osm_type || "x"}:${properties.osm_id || parsed.formatted}`;
    if (seen.has(id)) continue;
    seen.add(id);
    suggestions.push({
      id,
      provider: "photon",
      primary: parsed.addressLine1,
      secondary: [parsed.suburb, parsed.state, parsed.postcode].filter(Boolean).join(" "),
      parsed,
    });
    if (suggestions.length >= 6) break;
  }
  return suggestions;
}

type NominatimSearchResult = {
  place_id?: number;
  display_name?: string;
  address?: NominatimAddress;
};

async function suggestNominatim(query: string): Promise<AddressSuggestion[]> {
  const url = new URL(NOMINATIM_ENDPOINT);
  url.searchParams.set("q", `${query}, Australia`);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "au");
  url.searchParams.set("limit", "6");

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: abortAfter(LOOKUP_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Address lookup failed (${res.status})`);
  }

  const data = (await res.json()) as NominatimSearchResult[];
  const seen = new Set<string>();
  const suggestions: AddressSuggestion[] = [];

  for (const result of data ?? []) {
    if (!result.address) continue;
    const countryCode = (result.address.country_code || "").toLowerCase();
    if (countryCode && countryCode !== "au") continue;
    const parsed = parseNominatimAddress(result.address, result.display_name);
    if (!parsed.addressLine1) continue;
    const id = `nominatim:${result.place_id || parsed.formatted}`;
    if (seen.has(id)) continue;
    seen.add(id);
    suggestions.push({
      id,
      provider: "photon",
      primary: parsed.addressLine1,
      secondary: [parsed.suburb, parsed.state, parsed.postcode].filter(Boolean).join(" "),
      parsed,
    });
    if (suggestions.length >= 6) break;
  }
  return suggestions;
}
