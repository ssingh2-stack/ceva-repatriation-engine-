import { runPipeline } from "@/lib/pipeline";
import { PAIN_LABEL } from "@/lib/scoring/painBucket";

const r = runPipeline();
const { stats } = r;

console.log("\n─── CEVA Repatriation Signal Engine ───");
console.log(
  `seeded ${stats.seeded} · qualified ${stats.qualified} · excluded ${stats.excluded}`,
);
console.log(
  `tiers  A ${stats.tierA} · B ${stats.tierB} · C ${stats.tierC} · strategic ${stats.strategic} · corporate ${stats.corporate}`,
);
console.log(`est. pipeline freight  CAD $${stats.estPipelineFreightCad.toLocaleString()}\n`);

console.log("Top accounts:");
for (const sc of r.homes.slice(0, 12)) {
  const flag = sc.fit.strategicAccount ? "★" : " ";
  console.log(
    `  ${flag} [${sc.fit.tier}] ${String(sc.fit.score).padStart(3)}  ${sc.home.name} (${sc.home.municipality}) — ${PAIN_LABEL[sc.pain.primary]}`,
  );
}

if (r.excluded.length) {
  console.log("\nExcluded:");
  for (const e of r.excluded) console.log(`  - ${e.name}: ${e.reason}`);
}
console.log("");
