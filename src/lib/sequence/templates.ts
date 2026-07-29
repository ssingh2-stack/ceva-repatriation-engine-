import type { FuneralHome, PainKey } from "@/lib/types";
import { detectSignals } from "@/lib/signals/detectors";
import { painBucket } from "@/lib/scoring/painBucket";
import { config } from "@/lib/config";

// ── OUTBOUND SEQUENCES ────────────────────────────────────────────────
// Every step is composed from THIS home's real, observed facts: the
// destinations it actually ships to (or the countries its communities come
// from), the communities it serves, its city, the airline it currently
// leans on, the owner's name, its scale. Each email leads with a specific
// observation about the home and a concrete reason the timing matters now.
//
// Human-voice rules (no AI tonality): no "I hope this finds you well", no
// "I wanted to reach out", no "leverage/utilize/streamline/seamless/solution",
// no em dashes, no exclamation points, plain concrete nouns, varied sentence
// length, one reason per sentence. Respectful of grief, never flippant.

export type Channel = "email" | "linkedin" | "call";
export interface SequenceStep {
  day: number;
  channel: Channel;
  subject?: string;
  body: string;
}
export interface RenderedStep extends SequenceStep {}

export const CHANNEL_LABEL: Record<Channel, string> = { email: "Email", linkedin: "LinkedIn", call: "Call" };

// Which country a community most often repatriates to (used when a home
// doesn't list destinations but its communities imply them).
const COMMUNITY_COUNTRY: Record<string, string> = {
  Italian: "Italy", Portuguese: "Portugal", Greek: "Greece", Macedonian: "North Macedonia",
  Polish: "Poland", Ukrainian: "Ukraine", Chinese: "China", Korean: "South Korea",
  Vietnamese: "Vietnam", Filipino: "the Philippines", Tamil: "Sri Lanka", "Sri Lankan": "Sri Lanka",
  "South Asian": "India", Indian: "India", Hindu: "India", Sikh: "India", Pakistani: "Pakistan",
  "Ahmadiyya Muslim": "Pakistan", Bangladeshi: "Bangladesh", Gujarati: "India", Jamaican: "Jamaica",
  Caribbean: "the Caribbean", "Indo-Caribbean": "the Caribbean", African: "West Africa",
  "Latin American": "Latin America", Hispanic: "Latin America", Turkish: "Turkey", Arab: "the Middle East",
  "Middle Eastern": "the Middle East", Jewish: "Israel", Iranian: "Iran", Armenian: "Armenia",
  Russian: "Russia", Romanian: "Romania",
};

// How a person would say the home's name in a sentence: drop the legal
// suffix, chapel-location tail, and trailing parenthetical.
function shortName(name: string): string {
  let n = name.replace(/\s*\(.*?\)\s*$/, "").trim(); // trailing parenthetical
  n = n.split(/\s+[-—]\s+/)[0]; // " - Peel Chapel" / " — Peel Chapel"
  n = n.replace(/\s+(Funeral|Crematorium|Cremation|Memorial|Bereavement|Visitation)\b.*$/i, "").trim();
  n = n.replace(/[,\s]+(Inc\.?|Ltd\.?|Limited)$/i, "").trim();
  return n || name;
}

// Countries that read correctly with a leading "the".
const DEST_THE = new Set([
  "Philippines", "Netherlands", "United Kingdom", "Dominican Republic",
  "United States", "Bahamas", "Czech Republic", "Caribbean", "Middle East",
]);
function articleize(dest: string): string {
  if (/^the\s/i.test(dest)) return dest;
  return DEST_THE.has(dest) ? `the ${dest}` : dest;
}

function listPhrase(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

// Real destinations for a home: its listed ones (minus the vague "Worldwide"),
// else the countries its communities imply.
function destinationsFor(home: FuneralHome): string[] {
  const listed = home.repatriationDestinations.filter((d) => !/worldwide/i.test(d));
  if (listed.length) return listed.slice(0, 3);
  const fromCommunities = home.communities
    .map((c) => COMMUNITY_COUNTRY[c])
    .filter((c): c is string => !!c);
  return [...new Set(fromCommunities)].slice(0, 3);
}

interface Brief {
  greeting: string; // "Hi Amrit," or "Hello,"
  homeName: string;
  city: string;
  isCorp: boolean;
  destShort: string; // single destination for compact references
  destPhrase: string; // up to three, listed
  communityNames: string; // "Chinese and Filipino" or ""
  incumbent?: string;
  senderName: string;
  seasonClause: string; // the "why now" timing line
}

function seasonClause(destShort: string, month: number): string {
  if (month >= 5 && month <= 8)
    return `This is the busiest stretch of the travel year, so the cargo hold space that carries someone home to ${destShort} is booked out fastest right now.`;
  if (month >= 10 || month <= 1)
    return `Passenger travel spikes over the holidays and winter routes thin out, so repatriation space to ${destShort} fills up fast this time of year.`;
  return `Cargo space to ${destShort} tightens whenever passenger flights are full, which on those routes is most weeks.`;
}

function buildBrief(home: FuneralHome, opts: { senderName?: string; now?: Date }): Brief {
  const now = opts.now ?? new Date();
  const dests = destinationsFor(home).map(articleize);
  const destShort = dests[0] ?? "your families' home countries";
  const destPhrase = dests.length ? listPhrase(dests) : "your families' home countries";
  const specificCommunities = home.communities.filter((c) => COMMUNITY_COUNTRY[c] || ["Muslim", "Jewish", "Buddhist"].includes(c));
  return {
    greeting: home.contact.firstName ? `Hi ${home.contact.firstName},` : "Hello,",
    homeName: shortName(home.name),
    city: home.municipality,
    isCorp: home.contact.persona === "Regional/Procurement Manager",
    destShort,
    destPhrase,
    communityNames: listPhrase(specificCommunities.slice(0, 2)),
    incumbent: home.namedAirlinePartner,
    senderName: opts.senderName ?? config.senderName,
    seasonClause: seasonClause(destShort, now.getMonth()),
  };
}

// The one specific fact that explains why we picked THIS home.
function openerObservation(home: FuneralHome, b: Brief): string {
  if (home.hasRepatriationPage && b.destPhrase !== "your families' home countries")
    return `I was on ${b.homeName}'s site and saw you handle repatriation to ${b.destPhrase}.`;
  if (home.hasRepatriationPage)
    return `I saw ${b.homeName} arranges international shipping for families sending a loved one home.`;
  if (b.communityNames)
    return `${b.homeName} serves the ${b.communityNames} families in ${b.city}, which usually means repatriation to ${b.destPhrase}.`;
  if (home.worldwideShipping)
    return `I saw ${b.homeName} ships remains internationally.`;
  if (home.languages.length)
    return `${b.homeName} offers services in ${listPhrase(home.languages.slice(0, 3))}, so I expect you handle repatriation for those families.`;
  return `${b.homeName} came up as a ${b.city} home that arranges repatriation.`;
}

// The "why now": lead with the incumbent if we know it, then the seasonal reason.
function whyNow(b: Brief): string {
  if (b.incumbent)
    return `Right now most of those cases likely move through ${b.incumbent}, and their hold space to ${b.destShort} is the first thing to fill when passenger flights are full. ${b.seasonClause}`;
  return b.seasonClause;
}

// Pain-specific one-liner. Plain, concrete, no filler.
function painPitch(pain: PainKey, b: Brief): string {
  switch (pain) {
    case "route_gaps":
      return `The routes to ${b.destShort} are exactly where one airline's schedule falls short. We book through whichever carrier actually has space that week.`;
    case "airline_dependency":
      return `We are not tied to a single airline's compassion desk, so a full flight does not turn into a family waiting.`;
    case "documentation_burden":
      return `We handle the export permits and consular paperwork alongside the freight, so your staff is not chasing documents while a family waits.`;
    case "volume_scaling":
      return `At your case volume that adds up, so we set homes like yours up with one dedicated contact and priority space.`;
    case "cost_pressure":
      return `You would be on consolidated freight rates instead of the retail airline pricing that gets charged on every case.`;
  }
}

function painSubject(pain: PainKey, b: Brief): string {
  switch (pain) {
    case "route_gaps": return `Getting families home to ${b.destShort}`;
    case "airline_dependency": return `A backup when ${b.incumbent ?? "the cargo desk"} is full`;
    case "documentation_burden": return `The paperwork side of ${b.destShort} repatriations`;
    case "volume_scaling": return `Repatriation at ${b.homeName}'s volume`;
    case "cost_pressure": return `What ${b.homeName} pays to ship a loved one home`;
  }
}

export function renderSequence(
  home: FuneralHome,
  pain: PainKey,
  opts: { senderName?: string; now?: Date } = {},
): RenderedStep[] {
  const b = buildBrief(home, opts);
  const corpClause = b.isCorp
    ? " Since you coordinate this across locations, one carrier setup that works everywhere usually matters more than any single route."
    : "";

  return [
    {
      day: 1,
      channel: "email",
      subject: painSubject(pain, b),
      body: `${b.greeting}

${openerObservation(home, b)} ${whyNow(b)}

I work with CEVA Logistics on the cargo side of repatriation: booking the flight, clearing customs, and getting someone home. ${painPitch(pain, b)}${corpClause}

If it helps, I will put the current routing and timing for ${b.destShort} in a short note you can keep on file. I do not need a meeting to send it. Want me to?

${b.senderName}`,
    },
    {
      day: 3,
      channel: "linkedin",
      body: `${b.greeting} I sent ${b.homeName} a note earlier this week about repatriation to ${b.destShort}. Happy to pass along the routing and timing whenever it is useful.`,
    },
    {
      day: 5,
      channel: "call",
      body: `Call task: reference that ${b.homeName} repatriates to ${b.destPhrase}. Ask how those cases route today${b.incumbent ? ` (they lean on ${b.incumbent})` : ""} and where the delays tend to show up. Offer the routing note, not a meeting.`,
    },
    {
      day: 8,
      channel: "email",
      subject: `Re: ${b.destShort}`,
      body: `${b.greeting}

Following up on the note about ${b.destShort}. ${painPitch(pain, b)}

If it is worth fifteen minutes I will walk you through your actual routes and what the timing looks like out of ${b.city}. If it is not the right time, no problem.

${b.senderName}`,
    },
    {
      day: 12,
      channel: "email",
      subject: "Should I close this out?",
      body: `${b.greeting}

I will take the quiet as bad timing rather than no interest. If a case to ${b.destShort} gets tight this season and you want a second carrier option, reply here and I will jump on it the same day.

${b.senderName}`,
    },
  ];
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
