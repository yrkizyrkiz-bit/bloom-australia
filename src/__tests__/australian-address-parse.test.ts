import { describe, expect, it } from "vitest";
import {
  isAustralianPhotonFeature,
  parseGoogleAddressComponents,
  parseNominatimAddress,
  parsePhotonProperties,
} from "@/lib/address/parse";
import { toAuStateAbbreviation } from "@/lib/address/states";

describe("Australian address parsing", () => {
  it("maps full state names to abbreviations", () => {
    expect(toAuStateAbbreviation("New South Wales")).toBe("NSW");
    expect(toAuStateAbbreviation("vic")).toBe("VIC");
    expect(toAuStateAbbreviation("")).toBe("");
  });

  it("parses Google Places (New) address components", () => {
    const parsed = parseGoogleAddressComponents(
      [
        { longText: "19", shortText: "19", types: ["street_number"] },
        { longText: "Manly Road", shortText: "Manly Rd", types: ["route"] },
        { longText: "2", shortText: "2", types: ["subpremise"] },
        { longText: "Manly", shortText: "Manly", types: ["locality", "political"] },
        {
          longText: "New South Wales",
          shortText: "NSW",
          types: ["administrative_area_level_1", "political"],
        },
        { longText: "2095", shortText: "2095", types: ["postal_code"] },
      ],
      "2/19 Manly Road, Manly NSW 2095, Australia"
    );

    expect(parsed).toEqual({
      addressLine1: "19 Manly Road",
      addressLine2: "2",
      suburb: "Manly",
      state: "NSW",
      postcode: "2095",
      formatted: "2/19 Manly Road, Manly NSW 2095, Australia",
    });
  });

  it("parses legacy Google address components when locality is missing", () => {
    const parsed = parseGoogleAddressComponents([
      { long_name: "10", short_name: "10", types: ["street_number"] },
      { long_name: "Smith Street", short_name: "Smith St", types: ["route"] },
      { long_name: "Surry Hills", short_name: "Surry Hills", types: ["sublocality_level_1"] },
      {
        long_name: "New South Wales",
        short_name: "NSW",
        types: ["administrative_area_level_1"],
      },
      { long_name: "2010", short_name: "2010", types: ["postal_code"] },
    ]);

    expect(parsed.addressLine1).toBe("10 Smith Street");
    expect(parsed.suburb).toBe("Surry Hills");
    expect(parsed.state).toBe("NSW");
    expect(parsed.postcode).toBe("2010");
  });

  it("parses Photon AU features and ignores other countries", () => {
    expect(
      isAustralianPhotonFeature({ countrycode: "AU", country: "Australia" })
    ).toBe(true);
    expect(isAustralianPhotonFeature({ countrycode: "NZ" })).toBe(false);

    const parsed = parsePhotonProperties({
      housenumber: "42",
      street: "Queen Street",
      suburb: "Brisbane City",
      city: "Brisbane",
      state: "Queensland",
      postcode: "4000",
      countrycode: "AU",
    });

    expect(parsed).toMatchObject({
      addressLine1: "42 Queen Street",
      suburb: "Brisbane City",
      state: "QLD",
      postcode: "4000",
    });
  });

  it("parses Nominatim AU results", () => {
    const parsed = parseNominatimAddress(
      {
        house_number: "1",
        road: "Collins Street",
        suburb: "Melbourne",
        state: "Victoria",
        postcode: "3000",
        country_code: "au",
      },
      "1 Collins Street, Melbourne VIC 3000, Australia"
    );
    expect(parsed.addressLine1).toBe("1 Collins Street");
    expect(parsed.suburb).toBe("Melbourne");
    expect(parsed.state).toBe("VIC");
    expect(parsed.postcode).toBe("3000");
  });
});
