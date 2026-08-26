import { toAuStateAbbreviation } from "@/lib/address/states";
import type {
  GoogleAddressComponent,
  ParsedAustralianAddress,
} from "@/lib/address/types";

function componentText(
  component: GoogleAddressComponent,
  preferShort = false
): string {
  if (preferShort) {
    return (component.shortText || component.short_name || component.longText || component.long_name || "").trim();
  }
  return (component.longText || component.long_name || component.shortText || component.short_name || "").trim();
}

function firstComponent(
  components: GoogleAddressComponent[],
  types: string[],
  preferShort = false
): string {
  for (const type of types) {
    const match = components.find((component) => component.types?.includes(type));
    if (match) {
      const text = componentText(match, preferShort);
      if (text) return text;
    }
  }
  return "";
}

export function parseGoogleAddressComponents(
  components: GoogleAddressComponent[],
  formattedAddress?: string | null
): ParsedAustralianAddress {
  const streetNumber = firstComponent(components, ["street_number"]);
  const route = firstComponent(components, ["route"]);
  const subpremise = firstComponent(components, ["subpremise"]);
  const suburb = firstComponent(components, [
    "locality",
    "postal_town",
    "sublocality_level_1",
    "sublocality",
  ]);
  const state = toAuStateAbbreviation(
    firstComponent(components, ["administrative_area_level_1"], true) ||
      firstComponent(components, ["administrative_area_level_1"])
  );
  const postcode = firstComponent(components, ["postal_code"]).replace(/\D/g, "").slice(0, 4);
  const addressLine1 = [streetNumber, route].filter(Boolean).join(" ");

  const formatted =
    formattedAddress?.trim() ||
    [addressLine1, suburb, state, postcode].filter(Boolean).join(", ");

  return {
    addressLine1,
    addressLine2: subpremise,
    suburb,
    state,
    postcode,
    formatted,
  };
}

export type PhotonAddressProperties = {
  osm_id?: number | string;
  osm_type?: string;
  name?: string;
  housenumber?: string;
  street?: string;
  suburb?: string;
  district?: string;
  city?: string;
  town?: string;
  locality?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countrycode?: string;
};

export type NominatimAddress = {
  house_number?: string;
  road?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
};

export function isAustralianPhotonFeature(properties: PhotonAddressProperties): boolean {
  const code = (properties.countrycode || "").toUpperCase();
  const country = (properties.country || "").toLowerCase();
  return code === "AU" || country === "australia";
}

export function parsePhotonProperties(
  properties: PhotonAddressProperties
): ParsedAustralianAddress {
  const street =
    [properties.housenumber, properties.street].filter(Boolean).join(" ") ||
    properties.name ||
    "";
  const suburb =
    properties.suburb ||
    properties.district ||
    properties.city ||
    properties.town ||
    properties.locality ||
    "";
  const state = toAuStateAbbreviation(properties.state);
  const postcode = (properties.postcode || "").replace(/\D/g, "").slice(0, 4);

  return {
    addressLine1: street,
    addressLine2: "",
    suburb,
    state,
    postcode,
    formatted: [street, suburb, state, postcode].filter(Boolean).join(", "),
  };
}

export function parseNominatimAddress(
  address: NominatimAddress,
  displayName?: string
): ParsedAustralianAddress {
  const parsed = parsePhotonProperties({
    housenumber: address.house_number,
    street: address.road,
    suburb: address.suburb,
    city: address.city || address.town || address.village || address.municipality,
    state: address.state,
    postcode: address.postcode,
    country: address.country,
    countrycode: address.country_code,
  });
  if (displayName) parsed.formatted = displayName;
  return parsed;
}
