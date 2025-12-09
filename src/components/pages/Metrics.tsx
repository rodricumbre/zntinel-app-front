// src/components/pages/MetricsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import PageCard from "@/components/layout/PageCard";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.zntinel.com";

type TimeRange = "1h" | "24h" | "7d" | "30d";

type Totals = {
  totalRequests: number;
  blockedRequests: number;
  error5xx: number;
  uniqueIps: number;
  bandwidthBytes: number;
};

type PerDomain = {
  domain: string;
  total: number;
  blocked: number;
  error5xx: number;
  bandwidthBytes: number;
};

type TimelinePoint = {
  bucket: string;
  total: number;
  blocked: number;
};

type SimpleCount = {
  label: string;
  count: number;
};

type StatusCount = {
  status: number;
  count: number;
};

type PathStat = {
  path: string;
  count: number;
  blocked: number;
};

type MetricsOverview = {
  range: TimeRange;
  totals: Totals;
  perDomain: PerDomain[];
  trafficTimeline: TimelinePoint[];
  threatBreakdown: SimpleCount[];
  statusBreakdown: StatusCount[];
  countryBreakdown: SimpleCount[];
  topPaths: PathStat[];
};

type MetricsOverviewApiResponse = {
  success: boolean;
  metrics: MetricsOverview;
};

const bytesToHuman = (bytes: number): string => {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
};

const formatPct = (num: number, den: number): string => {
  if (!den || den <= 0) return "0%";
  return `${((num / den) * 100).toFixed(1)}%`;
};

const MetricsPage: React.FC = () => {
  const [range, setRange] = useState<TimeRange>("24h");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");

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

        const data = (await res.json()) as MetricsOverviewApiResponse | any;

        if (!res.ok || data.success === false) {
          throw new Error(
            data?.error || `HTTP ${res.status} en /metrics/overview`
          );
        }

        const raw = data.metrics || data;

        const safe: MetricsOverview = {
          range: (raw.range as TimeRange) || range,
          totals: {
            totalRequests: Number(raw?.totals?.totalRequests ?? 0),
            blockedRequests: Number(raw?.totals?.blockedRequests ?? 0),
            error5xx: Number(raw?.totals?.error5xx ?? 0),
            uniqueIps: Number(raw?.totals?.uniqueIps ?? 0),
            bandwidthBytes: Number(raw?.totals?.bandwidthBytes ?? 0),
          },
          perDomain: Array.isArray(raw?.perDomain) ? raw.perDomain : [],
          trafficTimeline: Array.isArray(raw?.trafficTimeline)
            ? raw.trafficTimeline
            : [],
          threatBreakdown: Array.isArray(raw?.threatBreakdown)
            ? raw.threatBreakdown.map((t: any) => ({
                label: t.label ?? t.type ?? "other",
                count: Number(t.count ?? 0),
              }))
            : [],
          statusBreakdown: Array.isArray(raw?.statusBreakdown)
            ? raw.statusBreakdown.map((s: any) => ({
                status: Number(s.status ?? 0),
                count: Number(s.count ?? 0),
              }))
            : [],
          countryBreakdown: Array.isArray(raw?.countryBreakdown)
            ? raw.countryBreakdown.map((c: any) => ({
                label: c.label ?? c.country ?? "??",
                count: Number(c.count ?? 0),
              }))
            : [],
          topPaths: Array.isArray(raw?.topPaths)
            ? raw.topPaths.map((p: any) => ({
                path: p.path ?? "/",
                count: Number(p.count ?? 0),
                blocked: Number(p.blocked ?? 0),
              }))
            : [],
        };

        if (!cancelled) {
          setOverview(safe);
          const domains = safe.perDomain.map((d) => d.domain);
          if (selectedDomain !== "all" && !domains.includes(selectedDomain)) {
            setSelectedDomain("all");
          }
        }
      } catch (e: any) {
        console.error("[METRICS] error", e);
        if (!cancelled) {
          setError(e?.message || "Error cargando métricas");
          setOverview(null);
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

  const totals = overview?.totals || {
    totalRequests: 0,
    blockedRequests: 0,
    error5xx: 0,
    uniqueIps: 0,
    bandwidthBytes: 0,
  };

  const effectivePerDomain = useMemo(() => {
    if (!overview) return [];
    if (selectedDomain === "all") return overview.perDomain;
    return overview.perDomain.filter((d) => d.domain === selectedDomain);
  }, [overview, selectedDomain]);

  const effectiveTimeline = useMemo(() => {
    if (!overview) return [];
    if (selectedDomain === "all") return overview.trafficTimeline;
    // si luego tienes timeline por dominio, aquí lo filtras
    return overview.trafficTimeline;
  }, [overview, selectedDomain]);

  const PIE_COLORS = ["#22c55e", "#fb7185", "#38bdf8", "#a855f7", "#f97316"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Métricas</h1>
          <p className="text-sm text-slate-400">
            Visión global del tráfico, bloqueos, errores y consumo por dominio
            en tu cuenta Zntinel.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Rango:</span>
            {(["1h", "24h", "7d", "30d"] as TimeRange[]).map((r) => (
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

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Dominio:</span>
            <select
              className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-[11px] text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/60"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              <option value="all">Todos</option>
              {overview?.perDomain.map((d) => (
                <option key={d.domain} value={d.domain}>
                  {d.domain}
                </option>
              ))}
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

      {/* KPIs */}
      {!loading && !error && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <PageCard>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-400">
                Peticiones totales
              </span>
              <span className="text-2xl font-semibold text-slate-50">
                {totals.totalRequests.toLocaleString("es-ES")}
              </span>
              <span className="text-[11px] text-slate-500">
                IPs únicas:{" "}
                <span className="text-slate-200">
                  {totals.uniqueIps.toLocaleString("es-ES")}
                </span>
              </span>
            </div>
          </PageCard>

          <PageCard>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-400">Bloqueos</span>
              <span className="text-2xl font-semibold text-rose-400">
                {totals.blockedRequests.toLocaleString("es-ES")}
              </span>
              <span className="text-[11px] text-slate-500">
                {formatPct(totals.blockedRequests, totals.totalRequests)} del
                tráfico total
              </span>
            </div>
          </PageCard>

          <PageCard>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-400">Errores 5xx</span>
              <span className="text-2xl font-semibold text-amber-300">
                {totals.error5xx.toLocaleString("es-ES")}
              </span>
              <span className="text-[11px] text-slate-500">
                {formatPct(totals.error5xx, totals.totalRequests)} del total
              </span>
            </div>
          </PageCard>

          <PageCard>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-400">
                Ancho de banda
              </span>
              <span className="text-2xl font-semibold text-sky-300">
                {bytesToHuman(totals.bandwidthBytes)}
              </span>
              <span className="text-[11px] text-slate-500">
                Tráfico servido por Zntinel
              </span>
            </div>
          </PageCard>
        </motion.div>
      )}

      {/* Timeline + dominios */}
      {!loading && !error && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)] gap-4">
          <PageCard
            title="Tráfico en el tiempo"
            subtitle="Picos de tráfico y bloqueos por franja."
          >
            <div className="h-64 w-full">
              {effectiveTimeline.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  No hay datos suficientes para el rango seleccionado.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={effectiveTimeline}>
                    <defs>
                      <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient
                        id="blockedGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#fb7185" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                      opacity={0.6}
                    />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderRadius: 8,
                        border: "1px solid #1e293b",
                        fontSize: 11,
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Total"
                      stroke="#38bdf8"
                      fill="url(#totalGradient)"
                      strokeWidth={1.8}
                    />
                    <Area
                      type="monotone"
                      dataKey="blocked"
                      name="Blocked"
                      stroke="#fb7185"
                      fill="url(#blockedGradient)"
                      strokeWidth={1.8}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </PageCard>

          <PageCard
            title="Tráfico por dominio"
            subtitle="Comparativa de volumen, bloqueos y errores."
          >
            {effectivePerDomain.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                No hay dominios con datos en este rango.
              </p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={effectivePerDomain}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                      opacity={0.6}
                    />
                    <XAxis
                      dataKey="domain"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderRadius: 8,
                        border: "1px solid #1e293b",
                        fontSize: 11,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="total" name="Total" stackId="a" fill="#38bdf8" />
                    <Bar
                      dataKey="blocked"
                      name="Blocked"
                      stackId="a"
                      fill="#fb7185"
                    />
                    <Bar
                      dataKey="error5xx"
                      name="5xx"
                      stackId="a"
                      fill="#facc15"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </PageCard>
        </div>
      )}

      {/* 3ª fila – amenazas / países / status */}
      {!loading && !error && overview && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <PageCard
            title="Tipos de amenaza"
            subtitle="Distribución de ataques detectados."
          >
            {overview.threatBreakdown.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                No se han clasificado amenazas en este rango.
              </p>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="h-48 md:flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overview.threatBreakdown}
                        dataKey="count"
                        nameKey="label"
                        outerRadius={70}
                        innerRadius={35}
                        paddingAngle={3}
                      >
                        {overview.threatBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          borderRadius: 8,
                          border: "1px solid #1e293b",
                          fontSize: 11,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="md:w-40 space-y-1">
                  {overview.threatBreakdown.map((t, i) => (
                    <div
                      key={t.label}
                      className="flex items-center justify-between text-[11px] text-slate-300"
                    >
                      <span className="flex items-center gap-1">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        {t.label}
                      </span>
                      <span className="text-slate-400">
                        {t.count.toLocaleString("es-ES")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </PageCard>

          <PageCard
            title="País origen tráfico"
            subtitle="Top países por número de peticiones."
          >
            {overview.countryBreakdown.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                No hay información de país en este rango.
              </p>
            ) : (
              <div className="space-y-2 text-[11px]">
                {overview.countryBreakdown.slice(0, 8).map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-slate-300">{c.label}</span>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-sky-500"
                          style={{
                            width: formatPct(
                              c.count,
                              overview.countryBreakdown[0].count || 1
                            ),
                          }}
                        />
                      </div>
                      <span className="text-slate-400">
                        {c.count.toLocaleString("es-ES")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PageCard>

          <PageCard
            title="Códigos de estado"
            subtitle="Distribución de respuestas HTTP."
          >
            {overview.statusBreakdown.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                No hay respuestas registradas en este rango.
              </p>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.statusBreakdown}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1e293b"
                      opacity={0.6}
                    />
                    <XAxis
                      dataKey="status"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderRadius: 8,
                        border: "1px solid #1e293b",
                        fontSize: 11,
                      }}
                    />
                    <Bar dataKey="count" name="Eventos" fill="#38bdf8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </PageCard>
        </div>
      )}

      {/* Top rutas */}
      {!loading && !error && overview && (
        <PageCard
          title="Rutas más activas"
          subtitle="Endpoints con más tráfico y bloqueos."
        >
          {overview.topPaths.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              No hay rutas destacadas para este rango.
            </p>
          ) : (
            <div className="border border-slate-800/80 rounded-xl overflow-auto bg-slate-950/60 max-h-[260px]">
              <table className="min-w-full text-[11px]">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800/80">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Ruta</th>
                    <th className="px-3 py-2 text-left font-medium">Hits</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Bloqueos
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      % bloqueado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overview.topPaths.slice(0, 30).map((p) => {
                    const pct = formatPct(p.blocked, p.count);
                    return (
                      <tr
                        key={p.path}
                        className="border-b border-slate-800/70 last:border-0 hover:bg-slate-900/40 transition"
                      >
                        <td className="px-3 py-2 text-slate-200">
                          <code className="text-[10px] break-all">
                            {p.path}
                          </code>
                        </td>
                        <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
                          {p.count.toLocaleString("es-ES")}
                        </td>
                        <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
                          {p.blocked.toLocaleString("es-ES")}
                        </td>
                        <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
                          {pct}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PageCard>
      )}
    </div>
  );
};

export default MetricsPage;
