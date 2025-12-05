import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Globe2,
  RefreshCw,
  Shield,
  Wifi,
} from "lucide-react";
import PageCard from "@/components/layout/PageCard";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Domain = {
  id: string;
  hostname: string;
  dns_status?: "pending" | "ok" | string;
  created_at?: string;
};

type HourlyPoint = {
  bucketStart: string;
  uptimePercent: number | null;
  totalRequests: number;
  blockedRequests: number;
  botRequests: number;
};

type MetricsOverview = {
  from: string;
  to: string;
  totals: {
    totalRequests: number;
    blockedRequests: number;
    botRequests: number;
    uptimePercent: number | null;
    avgTtfbMs: number | null;
    p95TtfbMs: number | null;
    lastStatusCode: number | null;
    lastCheckedAt: string | null;
    lastOk: boolean | null;
    timeoutErrors: number;
    networkErrors: number;
    http4xxErrors: number;
    http5xxErrors: number;
  };
  hourly: HourlyPoint[];
  security: {
    score: number | null;
    riskLevel: "low" | "medium" | "high" | "critical" | null;
    criticalIssues: number;
    warningIssues: number;
  };
  emailSecurity: {
    spfStatus: "configured" | "missing" | "unknown";
    dmarcPolicy:
      | "none"
      | "quarantine"
      | "reject"
      | "missing"
      | "unknown";
    dkimStatus: "unknown";
    dnssecStatus: "enabled" | "disabled";
  };
  topIssues: {
    id: string;
    severity: "critical" | "high" | "medium" | "low";
    category: string;
    title: string;
    detectedAt: string;
  }[];
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "https://api.zntinel.com";

function formatHourLabel(iso: string) {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDateTimeShort(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function riskLabel(
  risk: MetricsOverview["security"]["riskLevel"]
): string {
  switch (risk) {
    case "low":
      return "Riesgo bajo";
    case "medium":
      return "Riesgo medio";
    case "high":
      return "Riesgo alto";
    case "critical":
      return "Riesgo crítico";
    default:
      return "Sin datos";
  }
}

function riskBadgeClasses(
  risk: MetricsOverview["security"]["riskLevel"]
) {
  switch (risk) {
    case "low":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/40";
    case "medium":
      return "bg-amber-500/10 text-amber-300 border-amber-500/40";
    case "high":
      return "bg-orange-500/10 text-orange-300 border-orange-500/40";
    case "critical":
      return "bg-red-500/10 text-red-300 border-red-500/40";
    default:
      return "bg-slate-700/40 text-slate-300 border-slate-600/60";
  }
}

const Dashboard: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(
    null
  );
  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [refreshingCheck, setRefreshingCheck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDomain = useMemo(
    () => domains.find((d) => d.id === selectedDomainId) || null,
    [domains, selectedDomainId]
  );

  const securityScore = useMemo(() => {
    if (!overview || overview.security.score == null) return null;
    return Math.round(overview.security.score);
  }, [overview]);

  const pageLoadLabel = useMemo(() => {
    if (!overview || overview.totals.avgTtfbMs == null) return "Sin datos";

    const t = overview.totals.avgTtfbMs;
    const rounded = Math.round(t);

    if (t <= 300) return `${rounded} ms (muy rápido)`;
    if (t <= 800) return `${rounded} ms (rápido)`;
    if (t <= 1500) return `${rounded} ms (aceptable)`;
    return `${rounded} ms (lento)`;
  }, [overview]);

  const lastStatusLabel = useMemo(() => {
    if (!overview || overview.totals.lastStatusCode == null) {
      return "Sin datos";
    }

    const code = overview.totals.lastStatusCode;
    const ok = overview.totals.lastOk;

    if (ok) return `${code} (OK)`;
    if (code >= 500) return `${code} (error servidor)`;
    if (code >= 400) return `${code} (error aplicación / WAF)`;
    return `${code}`;
  }, [overview]);

  useEffect(() => {
    const loadDomains = async () => {
      try {
        setLoadingDomains(true);
        setError(null);

        const res = await fetch(`${API_BASE}/domains`, {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Error al cargar dominios");
        }

        const list: Domain[] = data.domains ?? [];
        setDomains(list);
        if (list.length && !selectedDomainId) {
          setSelectedDomainId(list[0].id);
        }
      } catch (e: any) {
        console.error(e);
        setError(
          e?.message || "No se pudieron cargar los dominios."
        );
      } finally {
        setLoadingDomains(false);
      }
    };

    loadDomains();
  }, []);

  useEffect(() => {
    const loadOverview = async () => {
      if (!selectedDomainId) return;
      try {
        setLoadingOverview(true);
        setError(null);

        const res = await fetch(
          `${API_BASE}/domains/${selectedDomainId}/metrics/overview`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(
            data.error || "Error al cargar las métricas"
          );
        }

        setOverview(data as MetricsOverview);
      } catch (e: any) {
        console.error(e);
        setError(
          e?.message || "No se pudieron cargar las métricas."
        );
      } finally {
        setLoadingOverview(false);
      }
    };

    loadOverview();
  }, [selectedDomainId]);

  const handleHealthRefresh = async () => {
    if (!selectedDomainId) return;
    try {
      setRefreshingCheck(true);
      setError(null);

      await fetch(
        `${API_BASE}/domains/${selectedDomainId}/health-check-now`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const res = await fetch(
        `${API_BASE}/domains/${selectedDomainId}/metrics/overview`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Error al refrescar las métricas"
        );
      }
      setOverview(data as MetricsOverview);
    } catch (e: any) {
      console.error(e);
      setError(
        e?.message || "No se pudo ejecutar el health check."
      );
    } finally {
      setRefreshingCheck(false);
    }
  };

  const uptimeSeries: HourlyPoint[] =
    overview?.hourly?.map((p) => ({
      ...p,
    })) ?? [];

  const hasTraffic =
    (overview?.totals.totalRequests ?? 0) > 0 ||
    uptimeSeries.some((p) => p.totalRequests > 0);

  return (
    <div className="space-y-6">
      {/* DOMINIOS / CONTEXTO */}
      <PageCard
        title="Estado de seguridad y disponibilidad"
        subtitle="Monitorización continua de tus dominios protegidos por Zntinel."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {loadingDomains && !domains.length && (
              <span className="text-xs text-slate-400">
                Cargando dominios...
              </span>
            )}

            {domains.map((d) => {
              const active = d.id === selectedDomainId;
              const verified = d.dns_status === "ok";

              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDomainId(d.id)}
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
                    active
                      ? "bg-sky-500/15 border-sky-400/60 text-sky-100 shadow-[0_0_18px_rgba(56,189,248,0.25)]"
                      : "bg-slate-900/80 border-slate-700/70 text-slate-200 hover:border-sky-500/50 hover:text-sky-100",
                  ].join(" ")}
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>{d.hostname}</span>
                  {verified ? (
                    <span className="rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] px-2 py-0.5 border border-emerald-500/40">
                      Verificado
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/10 text-amber-300 text-[10px] px-2 py-0.5 border border-amber-500/40">
                      Pendiente DNS
                    </span>
                  )}
                </button>
              );
            })}

            {!loadingDomains && !domains.length && (
              <span className="text-xs text-slate-400">
                Añade un dominio desde la sección “Dominios” para
                empezar a monitorizar.
              </span>
            )}

            <div className="ml-auto flex items-center gap-2">
              {overview?.totals.lastCheckedAt && (
                <span className="text-[11px] text-slate-500">
                  Último check:{" "}
                  <span className="text-slate-300">
                    {formatDateTimeShort(
                      overview.totals.lastCheckedAt
                    )}
                  </span>
                </span>
              )}
              <button
                onClick={handleHealthRefresh}
                disabled={!selectedDomainId || refreshingCheck}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-600/70 px-3 py-1.5 text-[11px] text-slate-200 hover:border-sky-400/70 hover:text-sky-100 hover:bg-slate-900/80 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    refreshingCheck ? "animate-spin" : ""
                  }`}
                />
                {refreshingCheck ? "Comprobando..." : "Actualizar ahora"}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-100">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </PageCard>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-6 xl:col-span-2">
          {/* Estado global */}
          <PageCard>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              <div className="flex flex-col gap-3 border-r border-slate-800/60 pr-4 md:col-span-1">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-[0.18em]">
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  Estado global
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-slate-50">
                    {securityScore != null ? securityScore : "—"}
                  </span>
                  <span className="text-xs text-slate-400">
                    / 100 · Score de seguridad
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={[
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                      riskBadgeClasses(
                        overview?.security.riskLevel ?? null
                      ),
                    ].join(" ")}
                  >
                    {overview?.security.riskLevel === "low" ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {riskLabel(overview?.security.riskLevel ?? null)}
                  </span>

                  <span className="text-[11px] text-slate-500">
                    Incidencias críticas:{" "}
                    <span className="text-slate-200">
                      {overview?.security.criticalIssues ?? 0}
                    </span>{" "}
                    · Avisos:{" "}
                    <span className="text-slate-200">
                      {overview?.security.warningIssues ?? 0}
                    </span>
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-[11px] text-slate-400 pt-1">
                  <span>
                    Uptime 24 h:{" "}
                    <span className="text-slate-100">
                      {overview?.totals.uptimePercent != null
                        ? `${overview.totals.uptimePercent.toFixed(
                            2
                          )} %`
                        : "Sin datos"}
                    </span>
                  </span>
                  <span>
                    TTFB medio:{" "}
                    <span className="text-slate-100">
                      {overview?.totals.avgTtfbMs != null
                        ? `${Math.round(
                            overview.totals.avgTtfbMs
                          )} ms`
                        : "Sin datos"}
                    </span>{" "}
                    · p95:{" "}
                    <span className="text-slate-100">
                      {overview?.totals.p95TtfbMs != null
                        ? `${Math.round(
                            overview.totals.p95TtfbMs
                          )} ms`
                        : "Sin datos"}
                    </span>
                  </span>
                  <span>
                    Último estado HTTP:{" "}
                    <span className="text-slate-100">
                      {lastStatusLabel}
                    </span>
                  </span>
                  <span>
                    Errores 4xx:{" "}
                    <span className="text-slate-100">
                      {overview?.totals.http4xxErrors ?? 0}
                    </span>{" "}
                    · 5xx:{" "}
                    <span className="text-slate-100">
                      {overview?.totals.http5xxErrors ?? 0}
                    </span>{" "}
                    · Timeouts/red:{" "}
                    <span className="text-slate-100">
                      {(overview?.totals.timeoutErrors ?? 0) +
                        (overview?.totals.networkErrors ?? 0)}
                    </span>
                  </span>
                </div>
              </div>

              {/* KPIs tráfico */}
              <div className="flex flex-col justify-between gap-3 md:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl border border-slate-800/70 bg-gradient-to-br from-slate-900/70 to-slate-950/90 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        Peticiones totales
                      </span>
                      <Wifi className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <div className="mt-1 text-xl font-medium text-slate-50">
                      {overview
                        ? overview.totals.totalRequests.toLocaleString(
                            "es-ES"
                          )
                        : "—"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800/70 bg-gradient-to-br from-slate-900/70 to-slate-950/90 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        Bloqueadas WAF
                      </span>
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                    <div className="mt-1 text-xl font-medium text-slate-50">
                      {overview
                        ? overview.totals.blockedRequests.toLocaleString(
                            "es-ES"
                          )
                        : "—"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800/70 bg-gradient-to-br from-slate-900/70 to-slate-950/90 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        Tráfico bot
                      </span>
                      <ActivityIcon />
                    </div>
                    <div className="mt-1 text-xl font-medium text-slate-50">
                      {overview
                        ? overview.totals.botRequests.toLocaleString(
                            "es-ES"
                          )
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  Page load estimado:{" "}
                  <span className="text-slate-100">
                    {pageLoadLabel}
                  </span>{" "}
                  · basado en origen, latencia y peticiones de
                  comprobación de Zntinel.
                  {overview && (
                    <>
                      <br />
                      Ventana analizada:{" "}
                      <span className="text-slate-300">
                        {formatDateTimeShort(overview.from)} –{" "}
                        {formatDateTimeShort(overview.to)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </PageCard>

          {/* Uptime */}
          <PageCard
            title="Disponibilidad y rendimiento (últimas 24 h)"
            subtitle="Uptime por hora y ventanas de degradación."
          >
            {loadingOverview && !overview && (
              <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                Cargando métricas...
              </div>
            )}

            {!loadingOverview && overview && !uptimeSeries.length && (
              <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                Aún no hay datos suficientes para este dominio.
              </div>
            )}

            {uptimeSeries.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={uptimeSeries}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.18)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="bucketStart"
                      tickFormatter={formatHourLabel}
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      stroke="#4b5563"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      stroke="#4b5563"
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#020617",
                        border: "1px solid rgba(148,163,184,0.35)",
                        borderRadius: 12,
                        fontSize: 11,
                      }}
                      labelFormatter={(label) =>
                        `Hora: ${formatHourLabel(label as string)}`
                      }
                      formatter={(value) => [
                        `${(value as number).toFixed(2)} %`,
                        "Uptime",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="uptimePercent"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </PageCard>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          <PageCard
            title="Tráfico y WAF (últimas 24 h)"
            subtitle="Volumen total, bloqueos y bots por hora."
          >
            {!hasTraffic && (
              <div className="flex items-center justify-center py-10 text-sm text-slate-400">
                De momento no hay tráfico registrado para este dominio.
              </div>
            )}

            {hasTraffic && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={uptimeSeries}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.14)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="bucketStart"
                      tickFormatter={formatHourLabel}
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      stroke="#4b5563"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      stroke="#4b5563"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#020617",
                        border: "1px solid rgba(148,163,184,0.35)",
                        borderRadius: 12,
                        fontSize: 11,
                      }}
                      labelFormatter={(label) =>
                        `Hora: ${formatHourLabel(label as string)}`
                      }
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: 11,
                        paddingTop: 8,
                      }}
                    />
                    <Area
                      type="monotone"
                      name="Total"
                      dataKey="totalRequests"
                      stroke="#38bdf8"
                      fill="url(#trafficTotal)"
                      stackId="1"
                    />
                    <Area
                      type="monotone"
                      name="Bloqueadas"
                      dataKey="blockedRequests"
                      stroke="#fb7185"
                      fill="url(#trafficBlocked)"
                      stackId="2"
                    />
                    <Area
                      type="monotone"
                      name="Bots"
                      dataKey="botRequests"
                      stroke="#c4b5fd"
                      fill="url(#trafficBot)"
                      stackId="3"
                    />
                    <defs>
                      <linearGradient
                        id="trafficTotal"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#38bdf8"
                          stopOpacity={0.65}
                        />
                        <stop
                          offset="100%"
                          stopColor="#0f172a"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="trafficBlocked"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#fb7185"
                          stopOpacity={0.7}
                        />
                        <stop
                          offset="100%"
                          stopColor="#0f172a"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="trafficBot"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#a855f7"
                          stopOpacity={0.6}
                        />
                        <stop
                          offset="100%"
                          stopColor="#0f172a"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </PageCard>

          <PageCard
            title="Seguridad de correo y DNS"
            subtitle={
              selectedDomain
                ? `Análisis básico de SPF, DMARC y DNSSEC para ${selectedDomain.hostname}.`
                : "Selecciona un dominio para ver su configuración."
            }
          >
            {overview ? (
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/80 px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-slate-400">
                      SPF
                    </span>
                    <span className="text-sm text-slate-100">
                      {overview.emailSecurity.spfStatus ===
                      "configured"
                        ? "Configurado"
                        : overview.emailSecurity.spfStatus ===
                          "missing"
                        ? "No configurado"
                        : "Desconocido"}
                    </span>
                  </div>
                  <StatusDot
                    ok={
                      overview.emailSecurity.spfStatus ===
                      "configured"
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/80 px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-slate-400">
                      DMARC
                    </span>
                    <span className="text-sm text-slate-100 capitalize">
                      {overview.emailSecurity.dmarcPolicy ===
                      "missing"
                        ? "No configurado"
                        : overview.emailSecurity.dmarcPolicy}
                    </span>
                  </div>
                  <StatusDot
                    ok={
                      overview.emailSecurity.dmarcPolicy ===
                        "quarantine" ||
                      overview.emailSecurity.dmarcPolicy ===
                        "reject"
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-950/80 px-3 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-slate-400">
                      DNSSEC
                    </span>
                    <span className="text-sm text-slate-100">
                      {overview.emailSecurity.dnssecStatus ===
                      "enabled"
                        ? "Activado"
                        : "No activado"}
                    </span>
                  </div>
                  <StatusDot
                    ok={
                      overview.emailSecurity.dnssecStatus ===
                      "enabled"
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="py-6 text-xs text-slate-400">
                Selecciona un dominio para ver su configuración de
                correo y DNS.
              </div>
            )}
          </PageCard>
        </div>
      </div>
    </div>
  );
};

const StatusDot: React.FC<{ ok: boolean }> = ({ ok }) => (
  <span
    className={[
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] border",
      ok
        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
        : "border-amber-500/50 bg-amber-500/10 text-amber-300",
    ].join(" ")}
  >
    <span
      className={[
        "h-2 w-2 rounded-full",
        ok ? "bg-emerald-400" : "bg-amber-400",
      ].join(" ")}
    />
    {ok ? "OK" : "Revisar"}
  </span>
);

const ActivityIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-3.5 h-3.5 text-violet-400"
    aria-hidden="true"
  >
    <path
      d="M4 12h4l2-6 4 12 2-6h4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Dashboard;
