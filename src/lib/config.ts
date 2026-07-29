// ── Runtime config ─────────────────────────────────────────────────
// Deterministic thresholds live here so scoring stays in one place.

function env(k: string): string | undefined {
  const v = process.env[k];
  return v && v.trim() ? v.trim() : undefined;
}

export const config = {
  auth: {
    user: env("DASHBOARD_USER") ?? "ceva",
    password: env("DASHBOARD_PASSWORD"),
  },
  senderName: env("SENDER_NAME") ?? "Sukhpreet Singh, CEVA Logistics",
};

// Est. annual repatriation freight (CAD) at/above which an account is "strategic".
export const STRATEGIC_MIN_FREIGHT_CAD = 75_000;
// Est. CEVA freight value captured per repatriation case (CAD).
export const AVG_FREIGHT_CAD = 2_500;
