import type { Tier, PainKey, Ownership } from "@/lib/types";

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1 max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${accent ? "border-accent/30 bg-accent/5" : "border-edge bg-panel/60"}`}>
      <div className={`text-2xl font-semibold tracking-tight tabular-nums ${accent ? "text-accent" : ""}`}>{value}</div>
      <div className="text-xs text-muted mt-0.5">{label}</div>
      {sub && <div className="text-[11px] text-muted/70 mt-0.5">{sub}</div>}
    </div>
  );
}

const tierColor: Record<Tier, string> = {
  A: "bg-good/12 text-good border-good/30",
  B: "bg-warn/12 text-warn border-warn/30",
  C: "bg-muted/12 text-muted border-muted/30",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`inline-block rounded-md border px-1.5 py-0.5 text-xs font-semibold ${tierColor[tier]}`}>
      {tier}
    </span>
  );
}

const painColor: Record<PainKey, string> = {
  route_gaps: "bg-blue-500/10 text-blue-700 border-blue-500/25",
  airline_dependency: "bg-purple-500/10 text-purple-700 border-purple-500/25",
  volume_scaling: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25",
  documentation_burden: "bg-amber-500/10 text-amber-700 border-amber-500/25",
  cost_pressure: "bg-cyan-500/10 text-cyan-700 border-cyan-500/25",
};

export function PainBadge({ pain, label }: { pain: PainKey; label: string }) {
  return (
    <span className={`inline-block rounded-md border px-1.5 py-0.5 text-xs font-medium ${painColor[pain]}`}>
      {label}
    </span>
  );
}

export function OwnershipBadge({ ownership, parent }: { ownership: Ownership; parent?: string }) {
  if (ownership === "corporate") {
    return (
      <span
        title={parent ? `Corporate — ${parent}` : "Corporate"}
        className="inline-block rounded-md border border-muted/30 bg-muted/10 px-1.5 py-0.5 text-[11px] font-medium text-muted"
      >
        Corporate
      </span>
    );
  }
  return (
    <span className="inline-block rounded-md border border-good/25 bg-good/10 px-1.5 py-0.5 text-[11px] font-medium text-good">
      Independent
    </span>
  );
}

export function StrategicStar({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <span title="Strategic account (high estimated freight)" className="text-accent">
      ★
    </span>
  );
}

export function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}
