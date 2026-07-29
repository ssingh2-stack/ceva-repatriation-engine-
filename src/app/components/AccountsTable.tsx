"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PainKey, Tier, Ownership } from "@/lib/types";
import { TierBadge, PainBadge, OwnershipBadge, StrategicStar, money } from "./ui";

export interface AccountRow {
  id: string;
  name: string;
  municipality: string;
  communities: string[];
  tier: Tier;
  score: number;
  pain: PainKey;
  painLabel: string;
  ownership: Ownership;
  strategic: boolean;
  estAnnualFreightCad: number;
}

export function AccountsTable({ rows }: { rows: AccountRow[] }) {
  const [muni, setMuni] = useState("");
  const [community, setCommunity] = useState("");
  const [tier, setTier] = useState("");
  const [owner, setOwner] = useState("");

  const municipalities = useMemo(
    () => [...new Set(rows.map((r) => r.municipality))].sort(),
    [rows],
  );
  const communities = useMemo(
    () => [...new Set(rows.flatMap((r) => r.communities))].sort(),
    [rows],
  );

  const filtered = rows.filter(
    (r) =>
      (!muni || r.municipality === muni) &&
      (!community || r.communities.includes(community)) &&
      (!tier || r.tier === tier) &&
      (!owner || r.ownership === owner),
  );

  const sel = "rounded-lg border border-edge bg-white px-2.5 py-1.5 text-sm";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select className={sel} value={muni} onChange={(e) => setMuni(e.target.value)}>
          <option value="">All municipalities</option>
          {municipalities.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select className={sel} value={community} onChange={(e) => setCommunity(e.target.value)}>
          <option value="">All communities</option>
          {communities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className={sel} value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="">All tiers</option>
          <option>A</option>
          <option>B</option>
          <option>C</option>
        </select>
        <select className={sel} value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="">All ownership</option>
          <option value="independent">Independent</option>
          <option value="corporate">Corporate</option>
        </select>
        <span className="ml-auto self-center text-xs text-muted">{filtered.length} of {rows.length}</span>
      </div>

      <div className="rounded-xl border border-edge overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-panel/70 text-muted text-xs">
            <tr>
              <th className="text-left font-medium px-3 py-2">Funeral home</th>
              <th className="text-left font-medium px-3 py-2 hidden sm:table-cell">Municipality</th>
              <th className="text-left font-medium px-3 py-2 hidden md:table-cell">Communities</th>
              <th className="text-center font-medium px-3 py-2">Tier</th>
              <th className="text-right font-medium px-3 py-2">Score</th>
              <th className="text-left font-medium px-3 py-2 hidden lg:table-cell">Primary pain</th>
              <th className="text-right font-medium px-3 py-2 hidden sm:table-cell">Est. freight/yr</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-panel/50">
                <td className="px-3 py-2">
                  <Link href={`/account/${r.id}`} className="font-medium hover:text-accent">
                    <StrategicStar on={r.strategic} /> {r.name}
                  </Link>
                  <span className="ml-2 align-middle">
                    <OwnershipBadge ownership={r.ownership} />
                  </span>
                </td>
                <td className="px-3 py-2 text-muted hidden sm:table-cell">{r.municipality}</td>
                <td className="px-3 py-2 text-muted hidden md:table-cell text-xs">
                  {r.communities.slice(0, 3).join(", ") || "—"}
                </td>
                <td className="px-3 py-2 text-center">
                  <TierBadge tier={r.tier} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">{r.score}</td>
                <td className="px-3 py-2 hidden lg:table-cell">
                  <PainBadge pain={r.pain} label={r.painLabel} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-muted hidden sm:table-cell">
                  {money(r.estAnnualFreightCad)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted text-sm">
                  No accounts match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
