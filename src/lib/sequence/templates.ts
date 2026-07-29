import type { FuneralHome, PainKey, Persona } from "@/lib/types";
import { detectSignals } from "@/lib/signals/detectors";
import { painBucket, PAIN_VALUE_PROP, PAIN_SHORT } from "@/lib/scoring/painBucket";
import { config } from "@/lib/config";

// ── OUTBOUND SEQUENCES ────────────────────────────────────────────────
// Five pain-specific 5-touch frameworks. Every framework leads with VALUE
// and a relevant observation, no meeting ask up front (give-to-get), then
// escalates the CTA. Voice: respectful and professional for a funeral
// director or procurement lead — never flippant about death, never salesy.
// Anti-AI writing rules: specifics over abstraction, varied closers, no
// banned filler, no em dashes. Merge tokens filled per home + persona.

export type Channel = "email" | "linkedin" | "call";
export interface SequenceStep {
  day: number;
  channel: Channel;
  subject?: string;
  body: string;
}
export interface RenderedStep extends SequenceStep {}

export const CHANNEL_LABEL: Record<Channel, string> = {
  email: "Email",
  linkedin: "LinkedIn",
  call: "Call",
};

// Persona-specific framing clause used in the opening email.
function personaAngle(persona: Persona): string {
  switch (persona) {
    case "Regional/Procurement Manager":
      return "for the families your locations serve";
    case "Managing Director":
      return "across your locations";
    case "Owner/Funeral Director":
    default:
      return "for the families you serve";
  }
}

function greeting(home: FuneralHome): string {
  const f = home.contact.firstName;
  if (f) return `Hi ${f},`;
  if (home.contact.persona === "Regional/Procurement Manager") return "Hello,";
  return `Hello ${home.name} team,`;
}

// A concrete destination or community to make the opener specific.
function destExample(home: FuneralHome): string {
  if (home.repatriationDestinations.length) return home.repatriationDestinations[0];
  if (home.communities.length) return `the ${home.communities[0]} community`;
  return "your families' home countries";
}

const FRAMEWORKS: Record<PainKey, SequenceStep[]> = {
  route_gaps: [
    {
      day: 1,
      channel: "email",
      subject: "Getting families home to {{destExample}}",
      body: `{{greeting}}

I saw that {{home}} handles repatriation {{personaAngle}}, including to {{destExample}}. Those routes are exactly where a single airline's schedule tends to fall short.

I work with CEVA Logistics. We move human remains as a multi-carrier freight forwarder, which means {{painValue}}.

I put together a short one-pager on how funeral homes shorten transit time to harder destinations. No call needed, I can just send it over. Want me to?

{{senderName}}`,
    },
    {
      day: 3,
      channel: "linkedin",
      body: `{{greeting}} Sent a note earlier this week about {{painShort}} for {{home}}. The one-pager on faster routing is ready whenever it is useful.`,
    },
    {
      day: 5,
      channel: "call",
      body: `Call task: reference that {{home}} repatriates to {{destExample}}. Ask how those cases route today, then offer the one-pager. Aim for a reply, not the meeting yet.`,
    },
    {
      day: 8,
      channel: "email",
      subject: "Re: getting families home",
      body: `{{greeting}}

The short version: {{painValue}}.

If it is worth fifteen minutes I will walk you through the routes you use most. Worst case you keep the reference and we leave it there.

{{senderName}}`,
    },
    {
      day: 12,
      channel: "email",
      subject: "Should I close this out?",
      body: `{{greeting}}

I will read the quiet as bad timing rather than no interest. If {{painShort}} is worth revisiting this quarter, reply here and I will pick it back up.

{{senderName}}`,
    },
  ],
  airline_dependency: [
    {
      day: 1,
      channel: "email",
      subject: "A backup when the cargo desk is full",
      body: `{{greeting}}

Most funeral homes I speak with route every repatriation through one airline cargo desk. It works until the flight is full or the route drops, and then a grieving family waits.

I am with CEVA Logistics. We give funeral homes {{painValue}}, booked through one point of contact.

Happy to send a short overview of how the backup routing works, nothing required on your end. Useful?

{{senderName}}`,
    },
    {
      day: 3,
      channel: "linkedin",
      body: `{{greeting}} Following up for {{home}} on {{painShort}}. The overview on multi-carrier routing is ready when you want it.`,
    },
    {
      day: 5,
      channel: "call",
      body: `Call task: ask which airline {{home}} uses for repatriation today and what happens when capacity runs out. Offer the overview.`,
    },
    {
      day: 8,
      channel: "email",
      subject: "Re: a backup for capacity",
      body: `{{greeting}}

One line: {{painValue}}.

If that is worth a quick look I am around this week. If the timing is off I will leave it here.

{{senderName}}`,
    },
    {
      day: 12,
      channel: "email",
      subject: "Closing the loop",
      body: `{{greeting}}

Last note from me. When {{painShort}} becomes a problem on a case, reply here and I will step in quickly.

{{senderName}}`,
    },
  ],
  documentation_burden: [
    {
      day: 1,
      channel: "email",
      subject: "The paperwork side of repatriation",
      body: `{{greeting}}

Repatriation is as much customs and consular paperwork as it is transport. When a permit or a certificate stalls, the whole shipment stalls.

I am with CEVA Logistics. We handle the freight and the customs brokerage together, which means {{painValue}}.

I can send a short checklist of the export documents that most often hold cases up. No call needed. Want it?

{{senderName}}`,
    },
    {
      day: 3,
      channel: "linkedin",
      body: `{{greeting}} Sent a note to {{home}} on {{painShort}}. That documentation checklist is ready whenever it helps.`,
    },
    {
      day: 5,
      channel: "call",
      body: `Call task: ask who handles export permits and consular documents for {{home}} today. Offer the checklist, keep it consultative.`,
    },
    {
      day: 8,
      channel: "email",
      subject: "Re: the paperwork side",
      body: `{{greeting}}

The value in one line: {{painValue}}.

If it is worth fifteen minutes I will show you where the handoffs usually break and how we close them.

{{senderName}}`,
    },
    {
      day: 12,
      channel: "email",
      subject: "Worth revisiting later?",
      body: `{{greeting}}

If now is not the moment, tell me when is and I will reconnect then. For reference, {{painValue}}.

{{senderName}}`,
    },
  ],
  volume_scaling: [
    {
      day: 1,
      channel: "email",
      subject: "As your repatriation volume grows",
      body: `{{greeting}}

A home doing repatriation at {{home}}'s volume {{personaAngle}} feels every delay, because there are more of them. That is usually the point where one-off airline bookings stop scaling.

I am with CEVA Logistics. We set high-volume homes up with {{painValue}}.

I can share how comparable homes structure this. No meeting required to see it. Interested?

{{senderName}}`,
    },
    {
      day: 3,
      channel: "linkedin",
      body: `{{greeting}} Reaching out to {{home}} about {{painShort}}. The write-up on structuring higher volume is ready when you are.`,
    },
    {
      day: 5,
      channel: "call",
      body: `Call task: reference {{home}}'s scale and ask how repatriation is coordinated across cases today. Offer the write-up.`,
    },
    {
      day: 8,
      channel: "email",
      subject: "Re: as volume grows",
      body: `{{greeting}}

Short version: {{painValue}}.

If it is worth a look I will walk you through what a dedicated setup changes. If not, no problem.

{{senderName}}`,
    },
    {
      day: 12,
      channel: "email",
      subject: "Closing the loop",
      body: `{{greeting}}

I will leave it here for now. When {{painShort}} is worth a closer look, reply and I will follow up.

{{senderName}}`,
    },
  ],
  cost_pressure: [
    {
      day: 1,
      channel: "email",
      subject: "What families pay to ship, and what you pay",
      body: `{{greeting}}

Retail airline compassion rates are built for one-off shipments. A home like {{home}} that repatriates regularly is paying that markup on every case.

I am with CEVA Logistics. We give funeral homes {{painValue}}, which usually protects your margin without raising the family's cost.

I can send a short cost comparison, nothing required on your end. Want me to pass it over?

{{senderName}}`,
    },
    {
      day: 3,
      channel: "linkedin",
      body: `{{greeting}} Following up with {{home}} on {{painShort}}. That cost comparison is ready whenever it is useful.`,
    },
    {
      day: 5,
      channel: "call",
      body: `Call task: ask how {{home}} prices repatriation for families today. Offer the cost comparison, stay consultative.`,
    },
    {
      day: 8,
      channel: "email",
      subject: "Re: shipping cost",
      body: `{{greeting}}

One line: {{painValue}}.

If the numbers are worth fifteen minutes I will run them against your actual routes. Worst case you keep the benchmark.

{{senderName}}`,
    },
    {
      day: 12,
      channel: "email",
      subject: "Should I close this out?",
      body: `{{greeting}}

I will read the silence as timing. If {{painShort}} is worth another look this quarter, reply here and I will pick it up.

{{senderName}}`,
    },
  ],
};

export function renderSequence(
  home: FuneralHome,
  pain: PainKey,
  opts: { senderName?: string } = {},
): RenderedStep[] {
  const tokens: Record<string, string> = {
    greeting: greeting(home),
    home: home.name,
    personaAngle: personaAngle(home.contact.persona),
    painShort: PAIN_SHORT[pain],
    painValue: PAIN_VALUE_PROP[pain],
    destExample: destExample(home),
    senderName: opts.senderName ?? config.senderName,
  };
  const fill = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => tokens[k] ?? `{{${k}}}`);

  return FRAMEWORKS[pain].map((step) => ({
    ...step,
    subject: step.subject ? fill(step.subject) : undefined,
    body: fill(step.body),
  }));
}

// Primary pain for a home, computed from its signals.
export function primaryPain(home: FuneralHome): PainKey {
  return painBucket(home, detectSignals(home)).primary;
}

// CSV export: one row per (home, step), for manual send in any tool.
export function buildCsv(homes: FuneralHome[]): string {
  const esc = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
  const header = "home,municipality,pain,persona,day,channel,subject,body";
  const rows: string[] = [header];
  for (const h of homes) {
    const pain = primaryPain(h);
    for (const step of renderSequence(h, pain)) {
      rows.push(
        [h.name, h.municipality, pain, h.contact.persona, String(step.day), step.channel, step.subject ?? "", step.body]
          .map(esc)
          .join(","),
      );
    }
  }
  return rows.join("\n");
}
