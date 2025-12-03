// src/components/pages/Dashboard.tsx
import React, { useEffect, useState, useCallback } from "react";
import { DomainOnboardingModal } from "@/components/domains/DomainOnboardingModal";
import { useAuth } from "@/lib/auth";

type Domain = {
  id: string;
  hostname: string;
  dns_status: "pending" | "ok";
  verification_token: string;
};

type HourlyPoint = {
  bucketStart: string;
  uptimePercent: number;
  totalChecks: number;
  errorChecks: number;
};

type DomainMetrics = {
  from: string;
  to: string;
  totalChecks: number;
  uptimePercent: number | null;
  lastStatusCode: number | null;
  lastCheckedAt: string | null;
  avgTtfbMs: number | null;
  p95TtfbMs: number | null;
  okChecks: number;
  errorChecks: number;
  timeoutErrors: number;
  networkErrors: number;
  http4xxErrors: number;
  http5xxErrors: number;
  hourly: HourlyPoint[];
};

const API_BASE =
  import.meta.env.VITE_API_URL ?? "https://api.zntinel.com";

function getMaxDomainsForPlan(plan: string | null | undefined) {
  if (plan === "business") return 2;
  if (plan === "premium") return 5;
  return 1;
}

function formatDateTime(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// helper para construir la URL de métricas con bust de caché
function getMetricsUrl(domainId: string) {
  const ts = Date.now();
  return `${API_BASE}/domains/${encodeURIComponent(
    domainId
  )}/metrics/overview?_ts=${ts}`;
}

const Dashboard: React.FC = () => {
  const { account } = useAuth();
  const [domains, setDomains] = useState<Domain[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [recentlyVerifiedId, setRecentlyVerifiedId] = useState<string | null>(
    null
  );

  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<DomainMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const maxDomains = getMaxDomainsForPlan(account?.plan);

  // -------- CARGA INICIAL DE DOMINIOS --------
  useEffect(() => {
    fetch(`${API_BASE}/domains`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const list: Domain[] = data.domains || [];
          setDomains(list);

          if (list.length === 0) {
            setIsOnboardingOpen(true);
          } else {
            setSelectedDomainId((prev) => prev ?? list[0].id);
          }
        } else {
          setError(data.error || "Error cargando dominios");
          setDomains([]);
          setIsOnboardingOpen(true);
        }
      })
      .catch((err) => {
        setError(String(err));
        setDomains([]);
        setIsOnboardingOpen(true);
      });
  }, []);

  useEffect(() => {
    if (!domains || domains.length === 0) return;
    if (!selectedDomainId) {
      setSelectedDomainId(domains[0].id);
    }
  }, [domains, selectedDomainId]);

  // mapea respuesta de API -> DomainMetrics
  const buildMetricsFromApi = (data: any): DomainMetrics => {
    const totals = data.totals || {};
    const totalChecks = Number(totals.totalRequests ?? 0);

    const hourlyRaw: any[] = Array.isArray(data.hourly) ? data.hourly : [];
    const hourly: HourlyPoint[] = hourlyRaw.map((b) => {
      const total =
        b.totalRequests != null
          ? Number(b.totalRequests)
          : Number(b.totalChecks ?? 0);
      const blocked =
        b.blockedRequests != null
          ? Number(b.blockedRequests)
          : Number(b.errorChecks ?? 0);

      const upChecks = Math.max(total - blocked, 0);
      const uptimePercent =
        total > 0 ? (upChecks / total) * 100 : 100;

      return {
        bucketStart: String(b.bucketStart),
        uptimePercent,
        totalChecks: total,
        errorChecks: blocked,
      };
    });

    return {
      from: data.from,
      to: data.to,
      totalChecks,
      uptimePercent:
        totals.uptimePercent != null
          ? Number(totals.uptimePercent)
          : null,
      lastStatusCode:
        totals.lastStatusCode != null
          ? Number(totals.lastStatusCode)
          : null,
      // si el backend no envía lastCheckedAt, usamos data.to como momento de "foto"
      lastCheckedAt: totals.lastCheckedAt ?? data.to ?? null,
      avgTtfbMs:
        totals.avgTtfbMs != null
          ? Math.round(Number(totals.avgTtfbMs))
          : null,
      p95TtfbMs:
        totals.p95TtfbMs != null
          ? Math.round(Number(totals.p95TtfbMs))
          : null,
      okChecks: Number(totals.allowedRequests ?? 0),
      errorChecks: Number(totals.blockedRequests ?? 0),
      timeoutErrors: Number(totals.timeoutErrors ?? 0),
      networkErrors: Number(totals.networkErrors ?? 0),
      http4xxErrors: Number(totals.http4xxErrors ?? 0),
      http5xxErrors: Number(totals.http5xxErrors ?? 0),
      hourly,
    };
  };

  // -------- CARGA DE MÉTRICAS --------
  const fetchMetrics = useCallback(() => {
    if (!selectedDomainId) {
      setMetrics(null);
      setMetricsError(null);
      return;
    }

    const currentDomain = domains?.find((d) => d.id === selectedDomainId);
    if (!currentDomain || currentDomain.dns_status !== "ok") {
      setMetrics(null);
      setMetricsError(null);
      return;
    }

    setMetricsLoading(true);
    setMetricsError(null);

    fetch(getMetricsUrl(selectedDomainId), {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setMetrics(null);
          setMetricsError(
            data.error || "No se han podido cargar las métricas"
          );
          return;
        }
        const mapped = buildMetricsFromApi(data);
        setMetrics(mapped);
      })
      .catch((err) => {
        setMetrics(null);
        setMetricsError(
          err?.message || "Error de red al cargar las métricas"
        );
      })
      .finally(() => {
        setMetricsLoading(false);
      });
  }, [selectedDomainId, domains]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleRefreshMetrics = () => {
    if (metricsLoading) return;
    fetchMetrics();
  };

  // -------- VERIFICACIÓN DE DOMINIOS --------
  async function handleVerify(domain: Domain) {
    if (verifyingId) return;
    setVerifyingId(domain.id);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/domains/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: domain.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "No se ha podido verificar el dominio");
        return;
      }

      if (data.verified && data.status === "ok") {
        setDomains((prev) =>
          prev.map((d) =>
            d.id === domain.id ? { ...d, dns_status: "ok" } : d
          )
        );
        setRecentlyVerifiedId(domain.id);

        if (selectedDomainId === domain.id) {
          setMetrics(null);
          fetchMetrics();
        }

        setTimeout(() => {
          setRecentlyVerifiedId((current) =>
            current === domain.id ? null : current
          );
        }, 5000);
      }
    } catch (err: any) {
      setError(err.message || "Error de red verificando el dominio");
    } finally {
      setVerifyingId(null);
    }
  }

  if (domains === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        Cargando tu panel de Zntinel…
      </div>
    );
  }

  const hasAnyDomain = domains.length > 0;
  const selectedDomain =
    domains.find((d) => d.id === selectedDomainId) || null;

  // Datos para la gráfica de uptime
  const uptimeSeries: HourlyPoint[] = metrics?.hourly ?? [];
  let uptimePolyline = "";
  if (uptimeSeries.length > 0) {
    const n = uptimeSeries.length;
    uptimePolyline = uptimeSeries
      .map((p, idx) => {
        const x = n === 1 ? 0 : (idx / (n - 1)) * 100;
        const clamped = Math.max(0, Math.min(100, p.uptimePercent));
        const y = 100 - clamped;
        return `${x},${y}`;
      })
      .join(" ");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <DomainOnboardingModal
        open={isOnboardingOpen}
        maxDomains={maxDomains}
        currentDomains={domains}
        onClose={() => {
          if (!hasAnyDomain) return;
          setIsOnboardingOpen(false);
        }}
        onDomainCreated={(newDomain) => {
          setDomains((prev) => [...prev, newDomain]);
          if (!selectedDomainId) {
            setSelectedDomainId(newDomain.id);
          }
          setIsOnboardingOpen(false);
        }}
      />

      <div className="max-w-5xl mx-auto">
        {!hasAnyDomain ? (
          <div className="mt-16 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center">
            <h1 className="text-xl font-semibold mb-2">
              Añade tu dominio para comenzar
            </h1>
            <p className="text-sm text-slate-400 mb-6">
              Antes de ver métricas o configurar reglas, conecta al menos un
              dominio a Zntinel.
            </p>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950"
            >
              Añadir dominio ahora
            </button>
            {error && (
              <p className="mt-4 text-xs text-red-400">Error: {error}</p>
            )}
          </div>
        ) : (
          <>
            {/* Tabs de dominios */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                {domains.map((d) => {
                  const isActive = d.id === selectedDomainId;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDomainId(d.id)}
                      className={[
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                        isActive
                          ? "bg-slate-100 text-slate-900 border-slate-100"
                          : "bg-slate-900/80 text-slate-200 border-slate-700 hover:border-cyan-500/60",
                      ].join(" ")}
                    >
                      {d.hostname}
                    </button>
                  );
                })}
              </div>

              {domains.length < maxDomains && (
                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5 text-xs font-medium text-slate-950"
                >
                  Añadir dominio
                </button>
              )}
            </div>

            {/* Tarjeta de verificación TXT (solo dominio seleccionado) */}
            <div className="space-y-3 mt-2">
              {domains
                .filter((d) => d.id === selectedDomainId)
                .map((d) => {
                  const isPending = d.dns_status === "pending";
                  const isVerified = d.dns_status === "ok";
                  const justVerified = recentlyVerifiedId === d.id;

                  const baseClasses =
                    "rounded-xl p-4 text-sm transition-all duration-500";
                  let colorClasses =
                    "border border-slate-800 bg-slate-900/80";

                  if (isPending) {
                    colorClasses =
                      "border border-amber-500/60 bg-amber-500/5";
                  }
                  if (isVerified) {
                    colorClasses =
                      "border border-emerald-500/40 bg-emerald-500/5";
                  }
                  if (justVerified) {
                    colorClasses =
                      "border border-emerald-400 bg-emerald-500/15 shadow-[0_0_0_1px_rgba(16,185,129,0.6)] animate-pulse";
                  }

                  return (
                    <div key={d.id} className={`${baseClasses} ${colorClasses}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium">{d.hostname}</div>
                        {isVerified && (
                          <span className="text-[11px] rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                            Verificado
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[11px] rounded-full border border-amber-500/60 bg-amber-500/10 px-2 py-0.5 text-amber-300">
                            Pendiente de verificación
                          </span>
                        )}
                      </div>

                      {isPending && (
                        <div className="mt-2 space-y-2">
                          <p className="text-slate-300 text-xs">
                            Añade este registro TXT en el DNS de tu dominio y
                            después pulsa “Comprobar TXT”:
                          </p>
                          <code className="block text-[11px] bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2">
                            Nombre: _zntinel.{d.hostname}
                            <br />
                            Valor: {d.verification_token}
                          </code>

                          <button
                            onClick={() => handleVerify(d)}
                            disabled={verifyingId === d.id}
                            className="mt-2 inline-flex items-center rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 px-3 py-1.5 text-xs font-medium text-slate-950"
                          >
                            {verifyingId === d.id
                              ? "Comprobando TXT…"
                              : "Comprobar TXT"}
                          </button>
                        </div>
                      )}

                      {isVerified && (
                        <p className="mt-2 text-emerald-200 text-xs">
                          {justVerified
                            ? "Dominio verificado correctamente. Cargando métricas…"
                            : "Dominio verificado. Las métricas del panel se basan en este dominio."}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>

            {error && (
              <p className="text-xs text-red-400 mt-3">Error: {error}</p>
            )}

            {/* Métricas */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-200">
                  Overview del dominio seleccionado
                </h2>
                <div className="flex items-center gap-2">
                  {metrics && metrics.lastCheckedAt && (
                    <span className="text-[11px] text-slate-500">
                      Última actualización:{" "}
                      {formatDateTime(metrics.lastCheckedAt)}
                    </span>
                  )}
                  <button
                    onClick={handleRefreshMetrics}
                    disabled={metricsLoading}
                    className="text-[11px] px-2 py-1 rounded-md border border-slate-700 bg-slate-900/80 hover:border-cyan-500/70 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {metricsLoading ? "Actualizando…" : "Actualizar"}
                  </button>
                </div>
              </div>

              {!selectedDomain ? (
                <p className="text-xs text-slate-500">
                  Selecciona un dominio para ver sus métricas.
                </p>
              ) : selectedDomain.dns_status !== "ok" ? (
                <p className="text-xs text-slate-500">
                  Verifica el dominio para empezar a recoger métricas.
                </p>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  {metricsLoading && (
                    <p className="text-xs text-slate-400">
                      Cargando métricas de {selectedDomain.hostname}…
                    </p>
                  )}

                  {metricsError && (
                    <p className="text-xs text-red-400">
                      Error al cargar métricas: {metricsError}
                    </p>
                  )}

                  {!metricsLoading && !metricsError && metrics && (
                    <>
                      {/* Gráfica uptime */}
                      {uptimeSeries.length > 0 && (
                        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                          <p className="text-[11px] text-slate-400 mb-2">
                            Uptime por hora (últimas 24 h)
                          </p>
                          <div className="h-40">
                            <svg
                              viewBox="0 0 100 100"
                              className="w-full h-full"
                              preserveAspectRatio="none"
                            >
                              <rect
                                x="0"
                                y="0"
                                width="100"
                                height="100"
                                className="fill-slate-950"
                              />
                              {[0, 25, 50, 75, 100].map((v) => (
                                <line
                                  key={v}
                                  x1="0"
                                  x2="100"
                                  y1={100 - v}
                                  y2={100 - v}
                                  className="stroke-slate-800"
                                  strokeWidth={v === 100 ? 0 : 0.4}
                                  strokeDasharray={v === 100 ? 0 : 2}
                                />
                              ))}

                              {uptimePolyline && (
                                <polyline
                                  points={uptimePolyline}
                                  fill="none"
                                  className="stroke-cyan-400"
                                  strokeWidth={1.5}
                                />
                              )}
                            </svg>
                          </div>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 mb-3">
                        Ventana analizada: últimas 24 horas.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
                          <p className="text-[11px] text-slate-400 mb-1">
                            Disponibilidad estimada
                          </p>
                          <p className="text-lg font-semibold text-emerald-400">
                            {metrics.uptimePercent === null
                              ? "—"
                              : `${metrics.uptimePercent.toFixed(1)}%`}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Basado en checks de salud en las últimas 24 h.
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
                          <p className="text-[11px] text-slate-400 mb-1">
                            Tiempo de respuesta medio (TTFB)
                          </p>
                          <p className="text-lg font-semibold">
                            {metrics.avgTtfbMs === null
                              ? "—"
                              : `${metrics.avgTtfbMs} ms`}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Media de todos los checks.
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
                          <p className="text-[11px] text-slate-400 mb-1">
                            Latencia p95
                          </p>
                          <p className="text-lg font-semibold">
                            {metrics.p95TtfbMs === null
                              ? "—"
                              : `${metrics.p95TtfbMs} ms`}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            El 95% de las respuestas fue más rápido que esto.
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
                          <p className="text-[11px] text-slate-400 mb-1">
                            Último estado
                          </p>
                          <p className="text-lg font-semibold">
                            {metrics.lastStatusCode ?? "—"}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Checks totales: {metrics.totalChecks}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
                        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
                          <p className="text-[11px] text-slate-400 mb-1">
                            Checks totales (últimas 24 h)
                          </p>
                          <p className="text-lg font-semibold">
                            {metrics.totalChecks ?? 0}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Número de comprobaciones realizadas contra este
                            dominio.
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
                          <p className="text-[11px] text-slate-400 mb-1">
                            Checks con error
                          </p>
                          <p className="text-lg font-semibold">
                            {metrics.errorChecks ?? 0}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Ratio de error:{" "}
                            {metrics.totalChecks > 0
                              ? `${(
                                  (metrics.errorChecks /
                                    metrics.totalChecks) *
                                  100
                                ).toFixed(1)}%`
                              : "—"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-950/50 border border-slate-800 p-3">
                          <p className="text-[11px] text-slate-400 mb-1">
                            Tipos de incidencias detectadas
                          </p>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Timeouts / red: {metrics.timeoutErrors} · HTTP 5xx:{" "}
                            {metrics.http5xxErrors} · HTTP 4xx / WAF:{" "}
                            {metrics.http4xxErrors}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Te ayuda a ver si los problemas vienen de caídas,
                            red o bloqueos de aplicación.
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {!metricsLoading &&
                    !metricsError &&
                    (!metrics || metrics.totalChecks === 0) && (
                      <p className="text-xs text-slate-500">
                        Aún no hay suficientes datos para este dominio. Deja
                        pasar unos minutos para que se recojan checks de salud.
                      </p>
                    )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
