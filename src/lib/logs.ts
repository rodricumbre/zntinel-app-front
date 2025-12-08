type IngestLogInput = {
  accountId: string;
  hostname: string;
  ip: string;
  country?: string;
  method: string;
  path: string;
  status: number;
  action: "allowed" | "blocked";
  threatType?: string;
  ruleId?: string;
  userAgent?: string;
  latencyMs?: number;
  bytes?: number;
};

export async function ingestHttpLog(
  env: Env,
  data: IngestLogInput
) {
  try {
    const supabase = getSupabase(env);

    await supabase.from("http_logs").insert({
      account_id: data.accountId,
      domain: data.hostname,
      country: data.country ?? null,
      method: data.method,
      path: data.path,
      status: data.status,
      action: data.action,
      threat_type: data.threatType ?? "none",
      rule_id: data.ruleId ?? null,
      user_agent: data.userAgent ?? null,
      latency_ms: data.latencyMs ?? null,
      bytes: data.bytes ?? null,
    });
  } catch (e) {
    // logging silencioso → JAMÁS romper tráfico
    console.error("[LOG_INGEST_ERROR]", e);
  }
}
