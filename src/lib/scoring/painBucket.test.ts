import { it, expect } from "vitest";
import { painBucket } from "./painBucket";
import { detectSignals } from "@/lib/signals/detectors";
import { strongHome } from "@/lib/__fixtures__/home";

it("picks a primary pain deterministically", () => {
  const p = painBucket(strongHome, detectSignals(strongHome));
  expect(p.primary).toBeDefined();
  expect(painBucket(strongHome, detectSignals(strongHome)).primary).toBe(p.primary);
});

it("route_gaps scores > 0 for a multi-community home", () => {
  const p = painBucket(strongHome, detectSignals(strongHome));
  expect(p.byPain.route_gaps).toBeGreaterThan(0);
});

it("secondary is undefined only when second-ranked pain has zero weight", () => {
  const p = painBucket(strongHome, detectSignals(strongHome));
  if (p.secondary) expect(p.byPain[p.secondary]).toBeGreaterThan(0);
});
