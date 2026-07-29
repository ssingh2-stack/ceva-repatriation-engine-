import { it, expect } from "vitest";
import { renderSequence, buildCsv, primaryPain } from "./templates";
import { strongHome } from "@/lib/__fixtures__/home";
import type { PainKey } from "@/lib/types";

const ALL_PAINS: PainKey[] = [
  "route_gaps",
  "airline_dependency",
  "documentation_burden",
  "volume_scaling",
  "cost_pressure",
];

it("renders a 5-touch sequence with no leftover merge tokens", () => {
  const steps = renderSequence(strongHome, "route_gaps", { senderName: "Test Rep" });
  expect(steps.length).toBe(5);
  for (const s of steps) {
    expect(s.body).not.toMatch(/\{\{/);
    if (s.subject) expect(s.subject).not.toMatch(/\{\{/);
  }
});

it("every pain framework renders cleanly with no em dashes", () => {
  for (const pain of ALL_PAINS) {
    for (const s of renderSequence(strongHome, pain)) {
      expect(s.body).not.toContain("—");
      expect(s.body).not.toMatch(/\{\{/);
    }
  }
});

it("persona changes the opening body", () => {
  const owner = renderSequence(strongHome, "route_gaps");
  const corp = renderSequence(
    { ...strongHome, ownership: "corporate", contact: { title: "Regional Manager", persona: "Regional/Procurement Manager" } },
    "route_gaps",
  );
  expect(owner[0].body).not.toBe(corp[0].body);
});

it("uses the contact first name in the greeting when present", () => {
  const named = renderSequence(
    { ...strongHome, contact: { ...strongHome.contact, firstName: "Amrit" } },
    "route_gaps",
  );
  expect(named[0].body.startsWith("Hi Amrit,")).toBe(true);
});

it("primaryPain returns a valid pain key", () => {
  expect(ALL_PAINS).toContain(primaryPain(strongHome));
});

it("buildCsv emits a header plus one row per step", () => {
  const csv = buildCsv([strongHome]);
  // Bodies contain newlines (valid quoted CSV fields), so count data rows by
  // their leading quoted home-name cell rather than by raw line count.
  expect(csv.startsWith("home,municipality,pain,persona,day,channel,subject,body\n")).toBe(true);
  const dataRows = csv.split(`\n"${strongHome.name}",`).length - 1;
  expect(dataRows).toBe(5); // 5 steps for one home
});
