import { it, expect } from "vitest";
import { detectSignals, topSignal } from "./detectors";
import { strongHome } from "@/lib/__fixtures__/home";

it("fires repatriation_page when a repatriation page exists", () => {
  const s = detectSignals(strongHome).find((x) => x.key === "repatriation_page")!;
  expect(s.present).toBe(true);
});

it("fires high_immigrant_municipality for Brampton", () => {
  const s = detectSignals(strongHome).find((x) => x.key === "high_immigrant_municipality")!;
  expect(s.present).toBe(true);
});

it("does NOT fire high_immigrant_municipality for Oakville", () => {
  const s = detectSignals({ ...strongHome, municipality: "Oakville" }).find(
    (x) => x.key === "high_immigrant_municipality",
  )!;
  expect(s.present).toBe(false);
});

it("multi_community requires >= 2 communities", () => {
  expect(detectSignals(strongHome).find((x) => x.key === "multi_community")!.present).toBe(true);
  expect(
    detectSignals({ ...strongHome, communities: ["Sikh"] }).find((x) => x.key === "multi_community")!.present,
  ).toBe(false);
});

it("topSignal returns the highest-weight present signal", () => {
  expect(topSignal(detectSignals(strongHome))!.key).toBe("repatriation_page");
});
