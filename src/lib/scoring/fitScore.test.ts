import { it, expect } from "vitest";
import { fitScore, gateReason, tierFor } from "./fitScore";
import { detectSignals } from "@/lib/signals/detectors";
import { strongHome, outsideGtaHome, noRemainsHome } from "@/lib/__fixtures__/home";

it("gates out a home outside the GTA", () => {
  expect(gateReason(outsideGtaHome)).toMatch(/Outside GTA/);
});

it("gates out a home with no remains-handling signal", () => {
  expect(gateReason(noRemainsHome)).toMatch(/No repatriation/);
});

it("passes a qualifying GTA home", () => {
  expect(gateReason(strongHome)).toBeNull();
});

it("tierFor maps the cuts", () => {
  expect(tierFor(70)).toBe("A");
  expect(tierFor(45)).toBe("B");
  expect(tierFor(20)).toBe("C");
});

it("a proven diaspora multi-location home scores tier A", () => {
  const f = fitScore(strongHome, detectSignals(strongHome));
  expect(f.passedGates).toBe(true);
  expect(f.score).toBeGreaterThanOrEqual(70);
  expect(f.tier).toBe("A");
});

it("intent multiplier > 1 when intent signals present", () => {
  const f = fitScore(strongHome, detectSignals(strongHome));
  expect(f.intentMultiplier).toBeGreaterThan(1);
});

it("gated home returns score 0 and does not pass", () => {
  const f = fitScore(outsideGtaHome, detectSignals(outsideGtaHome));
  expect(f.passedGates).toBe(false);
  expect(f.score).toBe(0);
});

it("scores are deterministic", () => {
  const a = fitScore(strongHome, detectSignals(strongHome)).score;
  const b = fitScore(strongHome, detectSignals(strongHome)).score;
  expect(a).toBe(b);
});

it("flags a high-volume home as strategic", () => {
  const f = fitScore(strongHome, detectSignals(strongHome));
  expect(f.strategicAccount).toBe(true);
  expect(f.estAnnualFreightCad).toBeGreaterThan(0);
});
