// src/components/pages/MetricsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import PageCard from "@/components/layout/PageCard";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.zntinel.com";

type MetricsRange = "1h" | "24h" | "7d" | "30d";

type MetricsTotals = {
  totalRequests: number;
  blockedRequests: number;
  error5xx: number;
  uniqueIps: number;
  bandwidthBytes: number;
};

type MetricsPerDomain = {
  domain: string;
  total: number;
  blocked: number;
  error5xx: number;
  bandwidthBytes: number;
};

type MetricsTimelinePoint = {
  bucket: string;
  total: number;
  blocked: number;
};

type MetricsLabelCount = {
  label: string;
  count: number;
};

type MetricsStatusCount = {
  status: number;
  count: number;
};

type MetricsTopPath = {
  path: string;
  count: number;
  blocked: number;
};

type MetricsOverview = {
  range: MetricsRange;
  totals: MetricsTotals;
  perDomain: MetricsPerDomain[];
  trafficTimeline: MetricsTimelinePoint[];
  threatBreakdown: MetricsLabelCount[];
  statusBreakdown: MetricsStatusCount[];
  countryBreakdown: MetricsLabelCount[];
  topPaths: MetricsTopPath[];
};

type MetricsOverviewResponse = {
  success: boolean;
  metrics: MetricsOverview;
};

type DomainSummary = {
  id: string;
  hostname: string;
};

const MetricsPage: React.FC = () => {
  const [range, setRange] = useState<MetricsRange>("30d");
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");

  // Cargar dominios para el selector
  useEffect(() => {
    let cancelled = false;

    async function loadDomains() {
      try {
        const res = await fetch(`${API_BASE_URL}/domains`, {
          method: "GET",
          credentials: "include",
        });

        const data = (await res.json()) as any;

        if (!res.ok || data.success === false) {
          throw new Error(data?.error || `HTTP ${res.status} en /domains`);
        }

        const list: DomainSummary[] = (data.domains || []).map(
          (d: any): DomainSummary => ({
            id: d.id,
            hostname: d.hostname || d.domain || "unknown",
          })
        );

        if (!cancelled) {
          setDomains(list);
          if (list.length > 0 && selectedDomain === "all") {
            setSelectedDomain(list[0].hostname);
          }
        }
      } catch (e: any) {
        console.error("[METRICS] error loading domains", e);
      }
    }

    loadDomains();
    return () => {
      cancelled = true;
    };
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar métricas cuando cambia el rango
  useEffect(() => {
    let cancelled = false;

    async function loadMetrics() {
      setLoading(true);
      setError(null);

      try {
        const url = new URL(`${API_BASE_URL}/metrics/overview`);
        url.searchParams.set("range", range);

        const res = await fetch(url.toString(), {
          method: "GET",
          credentials: "include",
        });

        const data = (await res.json()) as MetricsOverviewResponse | any;

        if (!res.ok || data.success === false) {
          throw new Error(
            data?.error || `HTTP ${res.status} en /metrics/overview`
          );
        }

        if (!cancelled) {
          setMetrics(data.metrics);
        }
      } catch (e: any) {
        console.error("[METRICS] error", e);
        if (!cancelled) {
          setError(e?.message || "Error cargando métricas");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMetrics();
    return () => {
      cancelled = true;
    };
  }, [range]);

  // Filtrado por dominio solo para algunos bloques
  const activeDomainStats = useMemo(() => {
    if (!metrics) return null;
    if (selectedDomain === "all") return null;
    return (
      metrics.perDomain.find((d) => d.domain === selectedDomain) || null
    );
  }, [metrics, selectedDomain]);

  const trafficTimeline = useMemo(() => {
    if (!metrics) return [];
    return metrics.trafficTimeline;
  }, [metrics]);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = bytes;
    let idx = 0;
    while (value >= 1024 && idx < units.length - 1) {
      value = value / 1024;
      idx++;
    }
    return `${value.toFixed(1)} ${units[idx]}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Métricas</h1>
          <p className="text-sm text-slate-400">
            Visión global del tráfico, bloqueos, errores y consumo en tu cuenta
            Zntinel.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center text-[11px]">
          {/* Rango temporal */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Rango:</span>
            {(["1h", "24h", "7d", "30d"] as MetricsRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-2 py-1 rounded-full border transition ${
                  range === r
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                    : "border-slate-700 text-slate-400 hover:border-cyan-400/60 hover:text-cyan-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Selector de dominio (solo afecta a algunos bloques) */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Dominio:</span>
            <select
              className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-[11px] text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/60 min-w-[150px]"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              {domains.length === 0 && (
                <option value="all">Sin dominios</option>
              )}
              {domains.length > 0 && (
                <>
                  <option value="all">Todos los dominios</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.hostname}>
                      {d.hostname}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <p className="text-xs text-slate-400">Cargando métricas…</p>
      )}

      {error && !loading && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {!loading && !error && !metrics && (
        <p className="text-xs text-slate-400">
          No hay datos de métricas para el rango seleccionado.
        </p>
      )}

      {metrics && (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <PageCard
              title="Peticiones totales"
              subtitle={`IPs únicas: ${metrics.totals.uniqueIps}`}
            >
              <p className="text-3xl font-semibold text-slate-50">
                {metrics.totals.totalRequests.toLocaleString("es-ES")}
              </p>
            </PageCard>

            <PageCard
              title="Bloqueos"
              subtitle={
                metrics.totals.totalRequests > 0
                  ? `${(
                      (metrics.totals.blockedRequests /
                        metrics.totals.totalRequests) *
                      100
                    ).toFixed(1)}% del tráfico total`
                  : "0% del tráfico total"
              }
            >
              <p className="text-3xl font-semibold text-rose-400">
                {metrics.totals.blockedRequests.toLocaleString("es-ES")}
              </p>
            </PageCard>

            <PageCard
              title="Errores 5xx"
              subtitle={
                metrics.totals.totalRequests > 0
                  ? `${(
                      (metrics.totals.error5xx /
                        metrics.totals.totalRequests) *
                      100
                    ).toFixed(1)}% del total`
                  : "0% del total"
              }
            >
              <p className="text-3xl font-semibold text-amber-300">
                {metrics.totals.error5xx.toLocaleString("es-ES")}
              </p>
            </PageCard>

            <PageCard
              title="Ancho de banda"
              subtitle="Tráfico servido por Zntinel"
            >
              <p className="text-3xl font-semibold text-sky-300">
                {formatBytes(metrics.totals.bandwidthBytes)}
              </p>
            </PageCard>
          </div>

          {/* Tráfico en el tiempo + tráfico por dominio */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-4">
            <PageCard
              title="Tráfico en el tiempo"
              subtitle="Picos de tráfico y bloqueos por franja."
            >
              {trafficTimeline.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No hay datos suficientes para el rango seleccionado.
                </p>
              ) : (
                <div className="mt-2 h-56 flex items-end gap-1 overflow-x-auto pr-1">
                  {trafficTimeline.map((p) => {
                    const max =
                      Math.max(
                        ...trafficTimeline.map((x) => x.total || 0),
                        1
                      ) || 1;
                    const heightTotal = (p.total / max) * 100;
                    const heightBlocked = (p.blocked / max) * 100;
                    return (
                      <div
                        key={p.bucket}
                        className="flex flex-col items-center min-w-[22px]"
                      >
                        <div className="relative w-2.5 rounded-full bg-slate-800/70 overflow-hidden h-40 flex flex-col justify-end">
                          <div
                            className="w-full bg-sky-500/70 transition-all"
                            style={{ height: `${heightTotal}%` }}
                          />
                          {p.blocked > 0 && (
                            <div
                              className="w-full bg-rose-500/80 absolute bottom-0 transition-all"
                              style={{ height: `${heightBlocked}%` }}
                            />
                          )}
                        </div>
                        <span className="mt-1 text-[9px] text-slate-500">
                          {p.bucket}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </PageCard>

            <PageCard
              title="Tráfico por dominio"
              subtitle="Comparativa de volumen, bloqueos y errores."
            >
              <div className="mt-2 space-y-2 max-h-64 overflow-auto pr-1">
                {metrics.perDomain.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No hay datos de dominios para este rango.
                  </p>
                )}

                {metrics.perDomain.map((d) => {
                  const pctBlocked =
                    d.total > 0 ? (d.blocked / d.total) * 100 : 0;
                  const pct5xx =
                    d.total > 0 ? (d.error5xx / d.total) * 100 : 0;

                  return (
                    <div
                      key={d.domain}
                      className="rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-[11px]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-100">
                          {d.domain}
                        </span>
                        <span className="text-slate-400">
                          {d.total.toLocaleString("es-ES")} req
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-900 overflow-hidden mb-1">
                        <div
                          className="h-full bg-sky-500/60"
                          style={{ width: "100%" }}
                        />
                        <div
                          className="h-full bg-rose-500/80"
                          style={{ width: `${pctBlocked}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>
                          Bloqueos:{" "}
                          <span className="text-rose-300">
                            {d.blocked.toLocaleString("es-ES")} (
                            {pctBlocked.toFixed(1)}%)
                          </span>
                        </span>
                        <span>
                          5xx:{" "}
                          <span className="text-amber-300">
                            {d.error5xx.toLocaleString("es-ES")} (
                            {pct5xx.toFixed(1)}%)
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PageCard>
          </div>

          {/* Tablas avanzadas: paths, reglas, países, status */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <PageCard
              title={
                selectedDomain === "all"
                  ? "Rutas más activas (toda la cuenta)"
                  : `Rutas más activas (${selectedDomain})`
              }
              subtitle="Volumen y ratio de bloqueo por path."
            >
              <div className="max-h-64 overflow-auto">
                <table className="min-w-full text-[11px]">
                  <thead className="text-slate-400 border-b border-slate-800/80">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium">
                        Path
                      </th>
                      <th className="px-2 py-1 text-right font-medium">
                        Hits
                      </th>
                      <th className="px-2 py-1 text-right font-medium">
                        Bloqueos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.topPaths.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-2 py-2 text-slate-500"
                        >
                          No hay rutas registradas en este rango.
                        </td>
                      </tr>
                    )}
                    {metrics.topPaths.map((p) => {
                      const pctBlocked =
                        p.count > 0 ? (p.blocked / p.count) * 100 : 0;
                      return (
                        <tr
                          key={p.path}
                          className="border-b border-slate-800/60 last:border-0 hover:bg-slate-900/40 transition"
                        >
                          <td className="px-2 py-1 text-slate-100">
                            {p.path}
                          </td>
                          <td className="px-2 py-1 text-right text-slate-300">
                            {p.count.toLocaleString("es-ES")}
                          </td>
                          <td className="px-2 py-1 text-right">
                            <span className="text-rose-300">
                              {p.blocked.toLocaleString("es-ES")} (
                              {pctBlocked.toFixed(1)}%)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </PageCard>

            <PageCard
              title="Distribución de errores y países"
              subtitle="Status más frecuentes y países de origen."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <h3 className="text-slate-200 font-medium mb-1">
                    Status codes
                  </h3>
                  <div className="max-h-48 overflow-auto">
                    {metrics.statusBreakdown.length === 0 && (
                      <p className="text-slate-500 text-xs">
                        No hay códigos registrados.
                      </p>
                    )}
                    {metrics.statusBreakdown.map((s) => (
                      <div
                        key={s.status}
                        className="flex items-center justify-between py-0.5"
                      >
                        <span className="text-slate-300">
                          {s.status}
                        </span>
                        <span className="text-slate-400">
                          {s.count.toLocaleString("es-ES")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-slate-200 font-medium mb-1">
                    País de origen
                  </h3>
                  <div className="max-h-48 overflow-auto">
                    {metrics.countryBreakdown.length === 0 && (
                      <p className="text-slate-500 text-xs">
                        No hay países registrados.
                      </p>
                    )}
                    {metrics.countryBreakdown.map((c) => (
                      <div
                        key={c.label}
                        className="flex items-center justify-between py-0.5"
                      >
                        <span className="text-slate-300">
                          {c.label}
                        </span>
                        <span className="text-slate-400">
                          {c.count.toLocaleString("es-ES")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PageCard>
          </div>

          {/* Reglas calientes */}
          <PageCard
            title="Reglas / firmas más activas"
            subtitle="Basado en cf_rule_id disparado en los logs."
          >
            <div className="max-h-64 overflow-auto">
              <table className="min-w-full text-[11px]">
                <thead className="text-slate-400 border-b border-slate-800/80">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium">
                      Regla
                    </th>
                    <th className="px-2 py-1 text-right font-medium">
                      Eventos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.threatBreakdown.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-2 py-2 text-slate-500"
                      >
                        No hay reglas registradas para este rango.
                      </td>
                    </tr>
                  )}
                  {metrics.threatBreakdown.map((r) => (
                    <tr
                      key={r.label}
                      className="border-b border-slate-800/60 last:border-0 hover:bg-slate-900/40 transition"
                    >
                      <td className="px-2 py-1 text-slate-100">
                        {r.label}
                      </td>
                      <td className="px-2 py-1 text-right text-slate-300">
                        {r.count.toLocaleString("es-ES")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PageCard>
        </>
      )}
    </div>
  );
};

export default MetricsPage;
