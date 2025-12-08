import React, { useEffect, useMemo, useState } from "react";
import PageCard from "@/components/layout/PageCard";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.zntinel.com";

type TimeRange = "1h" | "24h" | "7d" | "30d";

type TotalsMetrics = {
  requests: number;
  blocked: number;
  cached: number;
  errors5xx: number;
  errors4xx: number;
  uniqueIps: number;
  avgTtfbMs: number | null;
};

type DomainMetrics = {
  domain: string;
  requests: number;
  blocked: number;
  cached: number;
  errors5xx: number;
  errors4xx: number;
  avgTtfbMs: number | null;
};

type MetricsOverviewResponse = {
  success: boolean;
  range: TimeRange;
  totals: TotalsMetrics;
  perDomain: DomainMetrics[];
};

const MetricsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [totals, setTotals] = useState<TotalsMetrics | null>(null);
  const [perDomain, setPerDomain] = useState<DomainMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMetrics() {
      setLoading(true);
      setError(null);

      try {
        const url = new URL(`${API_BASE_URL}/metrics/overview`);
        url.searchParams.set("range", timeRange);

        const res = await fetch(url.toString(), {
          method: "GET",
          credentials: "include",
        });

        const data = (await res.json()) as MetricsOverviewResponse | any;

        if (!res.ok || data.success === false) {
          throw new Error(data?.error || `HTTP ${res.status} en /metrics/overview`);
        }

        if (!cancelled) {
          setTotals(data.totals || null);
          setPerDomain(Array.isArray(data.perDomain) ? data.perDomain : []);
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
  }, [timeRange]);

  const derived = useMemo(() => {
    if (!totals) {
      return {
        blockedPct: 0,
        cacheHitRatio: 0,
        errorRatePct: 0,
      };
    }

    const { requests, blocked, cached, errors4xx, errors5xx } = totals;

    const blockedPct = requests > 0 ? (blocked / requests) * 100 : 0;
    const cacheHitRatio = requests > 0 ? (cached / requests) * 100 : 0;
    const errorRatePct =
      requests > 0 ? ((errors4xx + errors5xx) / requests) * 100 : 0;

    return { blockedPct, cacheHitRatio, errorRatePct };
  }, [totals]);

  const fmtMillions = (n: number) =>
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M" : n.toLocaleString("es-ES");
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;
  const fmtMs = (n: number | null | undefined) =>
    n == null ? "—" : `${n.toFixed(0)} ms`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Métricas</h1>
          <p className="text-sm text-slate-400">
            Visión agregada de tráfico, bloqueos, errores y rendimiento por
            dominio protegido detrás de Zntinel.
          </p>
        </div>

        {/* selector de rango, misma tónica que Logs */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Rango:</span>
            {(["1h", "24h", "7d", "30d"] as TimeRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-2 py-1 rounded-full border transition ${
                  timeRange === r
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                    : "border-slate-700 text-slate-400 hover:border-cyan-400/60 hover:text-cyan-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Estado */}
      {loading && (
        <p className="text-xs text-slate-400">Cargando métricas…</p>
      )}
      {error && !loading && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Cards superiores con KPIs */}
      {totals && !loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <PageCard>
            <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">
              Tráfico inspeccionado
            </div>
            <div className="text-3xl font-semibold text-slate-50 mb-1">
              {fmtMillions(totals.requests)}
            </div>
            <p className="text-xs text-slate-400">
              Número total de requests HTTP(s) que han pasado por Zntinel en el
              rango seleccionado.
            </p>
          </PageCard>

          <PageCard>
            <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">
              Bloqueos de seguridad
            </div>
            <div className="text-3xl font-semibold text-emerald-400 mb-1">
              {fmtMillions(totals.blocked)}
            </div>
            <p className="text-xs text-slate-400">
              {fmtPct(derived.blockedPct)} del tráfico total ha sido bloqueado
              por WAF / Bot Management / rate limiting.
            </p>
          </PageCard>

          <PageCard>
            <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">
              Cache hit ratio
            </div>
            <div className="text-3xl font-semibold text-sky-400 mb-1">
              {fmtPct(derived.cacheHitRatio)}
            </div>
            <p className="text-xs text-slate-400">
              {fmtMillions(totals.cached)} requests servidos desde caché,
              reduciendo carga a origen.
            </p>
          </PageCard>

          <PageCard>
            <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">
              Errores &amp; rendimiento
            </div>
            <div className="text-lg font-semibold text-rose-300 mb-0.5">
              Error rate: {fmtPct(derived.errorRatePct)}
            </div>
            <div className="text-sm text-slate-300 mb-1">
              TTFB medio: {fmtMs(totals.avgTtfbMs)}
            </div>
            <p className="text-xs text-slate-400">
              {totals.errors5xx.toLocaleString("es-ES")} respuestas 5xx y{" "}
              {totals.errors4xx.toLocaleString("es-ES")} 4xx en el rango.
            </p>
          </PageCard>
        </div>
      )}

      {/* Tabla por dominio */}
      <PageCard
        title="Detalle por dominio"
        subtitle="Reparte el tráfico, bloqueos, errores y latencia por cada dominio protegido."
      >
        {!loading && !error && perDomain.length === 0 && (
          <p className="text-xs text-slate-400">
            No hay métricas disponibles para el rango seleccionado.
          </p>
        )}

        {!loading && !error && perDomain.length > 0 && (
          <div className="border border-slate-800/80 rounded-xl overflow-auto bg-slate-950/60 max-h-[520px]">
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800/80">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    Dominio
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Requests
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Bloqueadas
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    % bloqueadas
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Cache hits
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Error rate
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    TTFB medio
                  </th>
                </tr>
              </thead>
              <tbody>
                {perDomain.map((d) => {
                  const blockedPct =
                    d.requests > 0 ? (d.blocked / d.requests) * 100 : 0;
                  const errorRate =
                    d.requests > 0
                      ? ((d.errors4xx + d.errors5xx) / d.requests) * 100
                      : 0;
                  const cacheHit =
                    d.requests > 0 ? (d.cached / d.requests) * 100 : 0;

                  return (
                    <tr
                      key={d.domain}
                      className="border-b border-slate-800/70 last:border-0 hover:bg-slate-900/40 transition"
                    >
                      <td className="px-3 py-2 text-slate-100 whitespace-nowrap">
                        {d.domain}
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {d.requests.toLocaleString("es-ES")}
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {d.blocked.toLocaleString("es-ES")}
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {fmtPct(blockedPct)}
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {fmtPct(cacheHit)}
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {fmtPct(errorRate)}
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {fmtMs(d.avgTtfbMs)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>
    </div>
  );
};

export default MetricsPage;
