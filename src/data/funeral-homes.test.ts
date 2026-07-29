import { it, expect } from "vitest";
import { getFuneralHomes } from "./funeral-homes";

const GTA = new Set([
  "Brampton", "Mississauga", "Scarborough", "North York", "Markham", "Etobicoke",
  "Richmond Hill", "Vaughan", "Ajax", "Pickering", "Toronto", "Oakville",
  "Burlington", "Milton", "Oshawa", "Whitby", "Newmarket", "Aurora", "Caledon",
  "King City", "Georgetown", "Stouffville",
]);

const homes = getFuneralHomes();

it("has at least 40 real homes", () => {
  expect(homes.length).toBeGreaterThanOrEqual(40);
});

it("every id is unique", () => {
  const ids = homes.map((h) => h.id);
  expect(new Set(ids).size).toBe(ids.length);
});

it("every home cites at least one source URL", () => {
  for (const h of homes) {
    expect(h.sources.length).toBeGreaterThan(0);
    for (const s of h.sources) expect(s).toMatch(/^https?:\/\//);
  }
});

it("every siteUrl is a URL", () => {
  for (const h of homes) expect(h.siteUrl).toMatch(/^https?:\/\//);
});

it("every municipality is a real GTA municipality", () => {
  for (const h of homes) expect(GTA.has(h.municipality)).toBe(true);
});

it("has no placeholder names", () => {
  for (const h of homes) expect(h.name).not.toMatch(/\b(example|placeholder|lorem|dummy)\b|test memorial/i);
});

it("has no leftover HTML entities in names", () => {
  for (const h of homes) expect(h.name).not.toContain("&amp;");
});
