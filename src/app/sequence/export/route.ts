import { getPipeline } from "@/lib/pipeline";
import { buildCsv } from "@/lib/sequence/templates";

export const dynamic = "force-dynamic";

// GET /sequence/export — download every account's sequence as CSV for manual send.
export function GET() {
  const r = getPipeline();
  const csv = buildCsv(r.homes.map((h) => h.home));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ceva-sequences.csv"',
    },
  });
}
