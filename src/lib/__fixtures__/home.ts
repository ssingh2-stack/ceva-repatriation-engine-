import type { FuneralHome } from "@/lib/types";

// A strong, proven, multi-community, multi-location independent home — used
// across scoring/sequence tests. Deterministic, no real PII.
export const strongHome: FuneralHome = {
  id: "fixture-strong",
  name: "Test Memorial Chapel",
  address: "1 Main St",
  municipality: "Brampton",
  siteUrl: "https://example.test",
  ownership: "independent",
  hasRepatriationPage: true,
  repatriationDestinations: ["India", "Pakistan"],
  worldwideShipping: true,
  consularCoordination: true,
  embalmingForTransport: true,
  communities: ["South Asian", "Sikh"],
  languages: ["Punjabi", "Hindi"],
  locationsCount: 3,
  yearsInBusiness: 20,
  namedAirlinePartner: "Air Canada Cargo",
  obituariesMentionAbroad: true,
  reviewsMentionRepatriation: false,
  hiring: false,
  contact: { title: "Owner", persona: "Owner/Funeral Director" },
  sources: ["https://example.test"],
};

// A minimal home that should be gated out (outside GTA).
export const outsideGtaHome: FuneralHome = {
  ...strongHome,
  id: "fixture-outside",
  name: "Far Away Funeral Home",
  municipality: "Ottawa",
};

// A home with no remains-handling signals (should be gated out).
export const noRemainsHome: FuneralHome = {
  ...strongHome,
  id: "fixture-noremains",
  name: "Cemetery Only Inc",
  municipality: "Toronto",
  hasRepatriationPage: false,
  worldwideShipping: false,
  consularCoordination: false,
  embalmingForTransport: false,
  repatriationDestinations: [],
  communities: [],
  languages: [],
};
