export type ParsedAustralianAddress = {
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  state: string;
  postcode: string;
  formatted: string;
};

export type AddressLookupProvider = "google" | "photon";

export type AddressSuggestion = {
  id: string;
  provider: AddressLookupProvider;
  primary: string;
  secondary: string;
  parsed?: ParsedAustralianAddress;
};

export type GoogleAddressComponent = {
  long_name?: string;
  short_name?: string;
  longText?: string;
  shortText?: string;
  types: string[];
};
