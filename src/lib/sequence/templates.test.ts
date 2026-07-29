import { it, expect } from "vitest";
import { renderSequence, buildCsv, primaryPain } from "./templates";
import { strongHome } from "@/lib/__fixtures__/home";
import type { FuneralHome, PainKey } from "@/lib/types";

const ALL_PAINS: PainKey[] = [
  "route_gaps",
  "airline_dependency",
  "documentation_burden",
  "volume_scaling",
  "cost_pressure",
];

const summer = new Date("2026-07-15"); // fixed date so season copy is deterministic

it("renders a 5-touch sequence with no leftover merge tokens", () => {
  const steps = renderSequence(strongHome, "route_gaps", { senderName: "Test Rep", now: summer });
  expect(steps.length).toBe(5);
  for (const s of steps) {
    expect(s.body).not.toMatch(/\{\{/);
    if (s.subject) expect(s.subject).not.toMatch(/\{\{/);
  }
});

it("every pain framework renders cleanly with no em dashes and no AI filler", () => {
  const banned = /\b(leverage|utilize|streamline|seamless|robust|synergy|elevate|empower|unlock)\b|hope this (email |message )?finds you|—/i;
  for (const pain of ALL_PAINS) {
    for (const s of renderSequence(strongHome, pain, { now: summer })) {
      expect(s.body).not.toMatch(banned);
      expect(s.body).not.toMatch(/\{\{/);
    }
  }
});

it("personalizes with the home's real destinations and city", () => {
  const step = renderSequence(strongHome, "route_gaps", { now: summer })[0];
  // strongHome ships to India / Pakistan and is in Brampton
  expect(step.body).toMatch(/India|Pakistan/);
  const day8 = renderSequence(strongHome, "route_gaps", { now: summer })[3];
  expect(day8.body).toContain("Brampton");
});

it("names the incumbent airline when the home has one", () => {
  const steps = renderSequence(strongHome, "airline_dependency", { now: summer }); // strongHome uses Air Canada Cargo
  expect(steps[0].body).toContain("Air Canada Cargo");
});

it("derives a destination from communities when none are listed", () => {
  const home: FuneralHome = {
    ...strongHome,
    repatriationDestinations: [],
    communities: ["Filipino"],
    namedAirlinePartner: undefined,
  };
  expect(renderSequence(home, "route_gaps", { now: summer })[0].body).toContain("the Philippines");
});

it("gives a concrete why-now reason (seasonal capacity)", () => {
  const body = renderSequence(strongHome, "route_gaps", { now: summer })[0].body;
  expect(body).toMatch(/busiest stretch of the travel year|cargo hold space/i);
});

it("uses the contact first name in the greeting when present", () => {
  const named = renderSequence(
    { ...strongHome, contact: { ...strongHome.contact, firstName: "Amrit" } },
    "route_gaps",
    { now: summer },
  );
  expect(named[0].body.startsWith("Hi Amrit,")).toBe(true);
});

it("persona changes the opening body", () => {
  const owner = renderSequence(strongHome, "route_gaps", { now: summer });
  const corp = renderSequence(
    { ...strongHome, ownership: "corporate", contact: { title: "Regional Manager", persona: "Regional/Procurement Manager" } },
    "route_gaps",
    { now: summer },
  );
  expect(owner[0].body).not.toBe(corp[0].body);
});

it("primaryPain returns a valid pain key", () => {
  expect(ALL_PAINS).toContain(primaryPain(strongHome));
});

it("buildCsv emits a header plus one row per step", () => {
  const csv = buildCsv([strongHome]);
  expect(csv.startsWith("home,municipality,pain,persona,day,channel,subject,body\n")).toBe(true);
  const dataRows = csv.split(`\n"${strongHome.name}",`).length - 1;
  expect(dataRows).toBe(5);
});
