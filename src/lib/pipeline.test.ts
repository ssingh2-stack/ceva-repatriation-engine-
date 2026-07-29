import { it, expect } from "vitest";
import { runPipeline } from "./pipeline";
import { strongHome, outsideGtaHome, noRemainsHome } from "@/lib/__fixtures__/home";

const fixture = [strongHome, outsideGtaHome, noRemainsHome];

it("qualifies GTA remains-handling homes and excludes the rest", () => {
  const r = runPipeline(fixture);
  expect(r.homes.map((h) => h.home.id)).toContain("fixture-strong");
  expect(r.excluded.map((e) => e.id)).toEqual(
    expect.arrayContaining(["fixture-outside", "fixture-noremains"]),
  );
});

it("sorts qualified homes by score descending", () => {
  const r = runPipeline([{ ...strongHome, id: "a" }, { ...strongHome, id: "b", communities: [], languages: [], repatriationDestinations: [], locationsCount: 1, worldwideShipping: false, embalmingForTransport: false, consularCoordination: false }]);
  for (let i = 1; i < r.homes.length; i++) {
    expect(r.homes[i - 1].fit.score).toBeGreaterThanOrEqual(r.homes[i].fit.score);
  }
});

it("stats counts are internally consistent", () => {
  const r = runPipeline(fixture);
  expect(r.stats.seeded).toBe(fixture.length);
  expect(r.stats.qualified + r.stats.excluded).toBe(r.stats.seeded);
  expect(r.stats.tierA + r.stats.tierB + r.stats.tierC).toBe(r.stats.qualified);
});
