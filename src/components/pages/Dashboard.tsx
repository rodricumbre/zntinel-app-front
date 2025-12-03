// src/components/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { DomainOnboardingModal } from "@/components/domains/DomainOnboardingModal";
import { useAuth } from "@/lib/auth";

type Domain = {
  id: string;
  hostname: string;
  dns_status: "pending" | "ok";
  verification_token: string;
};

type DomainMetricsOverview = {
  from: string;
  to: string;
  totals: {
    totalRequests: number;
    allowedRequests: number;
    blockedRequests: number;
    botRequests: number;
  };
  hourly: {
    bucketStart: string;
    totalRequests: number;
    blockedRequests: number;
  }[];
};

type VerifyFeedback =
  | {
      domainId: string;
      type: "error";
      message: string;
    }
  | null;

const API_BASE =
  import.meta.env.VITE_API_URL ?? "https://api.zntinel.com";

function getMaxDomainsForPlan(plan: string | null | undefined) {
  if (plan === "business") return 2;
  if (plan === "premium") return 5;
  return 1;
}

const Dashboard: React.FC = () => {
  const { account } = useAuth();
  const [domains, setDomains] = useState<Domain[] | null>(null);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // verificación TXT
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyFeedback, setVerifyFeedback] = useState<VerifyFeedback>(null);
  const [recentlyVerifiedId, setRecentlyVerifiedId] = useState<string | null>(
    null
  );

  // métricas
  const [metrics, setMetrics] = useState<DomainMetricsOverview | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const maxDomains = getMaxDomainsForPlan(account?.plan);

  // Cargar dominios
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

  const selectedDomain =
    domains?.find((d) => d.id === selectedDomainId) ?? null;

  // Helpers verificación
  function showVerifyError(domainId: string, message: string) {
    setVerifyFeedback({ domainId, type: "error", message });
    setTimeout(() => {
      setVerifyFeedback((current) =>
        current && current.domainId === domainId ? null : current
      );
    }, 7000);
  }

  function mapReasonToMessage(domain: Domain, reason?: string | null): string {
    if (reason === "DNS_LOOKUP_FAILED") {
      return "No se ha podido consultar los DNS del dominio. Vuelve a intentarlo en unos minutos.";
    }
    if (reason === "TXT_TOKEN_NOT_FOUND") {
      return `No se ha encontrado un registro TXT válido. Revisa que exista el registro "_zntinel.${domain.hostname}" y que el valor coincida exactamente con el token mostrado.`;
    }
    return "El dominio todavía no está verificado. Revisa el registro TXT y vuelve a intentarlo en unos minutos.";
  }

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
        const msg =
          data.error ||
          `No se ha podido verificar el dominio (HTTP ${res.status})`;
        showVerifyError(domain.id, msg);
        return;
      }

      if (data.verified && data.status === "ok") {
        setDomains((prev) =>
          prev.map((d) =>
            d.id === domain.id ? { ...d, dns_status: "ok" } : d
          )
        );
        setRecentlyVerifiedId(domain.id);

        setTimeout(() => {
          setRecentlyVerifiedId((current) =>
            current === domain.id ? null : current
          );
        }, 5000);
        return;
      }

      const reason: string | null | undefined = data.reason;
      const msg = mapReasonToMessage(domain, reason);
      showVerifyError(domain.id, msg);
    } catch (err: any) {
      showVerifyError(
        domain.id,
        err?.message || "Error de red verificando el dominio"
      );
    } finally {
      setVerifyingId(null);
    }
  }

  // Cargar métricas cuando el dominio seleccionado esté verificado
  useEffect(() => {
    if (!selectedDomain || selectedDomain.dns_status !== "ok") {
      setMetrics(null);
      setMetricsError(null);
      return;
    }

    setMetricsLoading(true);
    setMetricsError(null);

    fetch(
      `${API_BASE}/domains/${encodeURIComponent(
        selectedDomain.id
      )}/metrics/overview`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setMetrics(null);
          setMetricsError(
            data.error || "No se han podido cargar las métricas."
          );
          return;
        }
        setMetrics(data as DomainMetricsOverview);
      })
      .catch((err) => {
        setMetrics(null);
        setMetricsError(String(err));
      })
      .finally(() => setMetricsLoading(false));
  }, [selectedDomain?.id, selectedDomain?.dns_status]);

  if (domains === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        Cargando tu panel de Zntinel…
      </div>
    );
  }

  const hasAnyDomain = domains.length > 0;

  // Para el gráfico de barras horizontales
  const maxHourlyTotal =
    metrics?.hourly.length
      ? Math.max(...metrics.hourly.map((h) => h.totalRequests || 0))
      : 0;

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
          setSelectedDomainId(newDomain.id);
          setIsOnboardingOpen(false);
        }}
      />

      <div className="max-w-6xl mx-auto">
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
            {/* SUBTOPBAR DE DOMINIOS */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-wrap gap-2">
                {domains.map((d) => {
                  const active = d.id === selectedDomainId;
                  const pending = d.dns_status === "pending";

                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDomainId(d.id)}
                      className={[
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        active
                          ? "bg-slate-100 text-slate-900 border-slate-100"
                          : "bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500",
                      ].join(" ")}
                    >
                      <span>{d.hostname}</span>
                      {pending && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Pendiente
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {domains.length < maxDomains && (
                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5 text-xs font-medium text-slate-950"
                >
                  Añadir otro dominio
                </button>
              )}
            </div>

            {/* CONTENIDO DEL DOMINIO SELECCIONADO */}
            {selectedDomain && (
              <div className="space-y-6">
                {/* Bloque de verificación / info */}
                {selectedDomain.dns_status === "pending" && (
                  <div className="rounded-2xl border border-amber-500/60 bg-amber-500/5 p-5 text-sm">
                    <h2 className="text-sm font-semibold text-amber-100 mb-2">
                      Verifica el dominio para empezar a recoger métricas
                    </h2>
                    <p className="text-xs text-amber-100/80 mb-3">
                      Añade este registro TXT en el DNS de tu dominio y después
                      pulsa “Comprobar TXT”.
                    </p>
                    <code className="block text-[11px] bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 mb-3 text-amber-50">
                      Nombre: _zntinel.{selectedDomain.hostname}
                      <br />
                      Valor: {selectedDomain.verification_token}
                    </code>

                    <button
                      onClick={() => handleVerify(selectedDomain)}
                      disabled={verifyingId === selectedDomain.id}
                      className="inline-flex items-center rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 px-3 py-1.5 text-xs font-medium text-slate-950"
                    >
                      {verifyingId === selectedDomain.id
                        ? "Comprobando TXT…"
                        : "Comprobar TXT"}
                    </button>

                    {verifyFeedback &&
                      verifyFeedback.domainId === selectedDomain.id &&
                      verifyFeedback.type === "error" && (
                        <p className="mt-2 text-xs text-red-300">
                          {verifyFeedback.message}
                        </p>
                      )}
                  </div>
                )}

                {selectedDomain.dns_status === "ok" && (
                  <>
                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-xs text-emerald-100">
                      {recentlyVerifiedId === selectedDomain.id
                        ? "Dominio verificado correctamente. Empezando a recopilar métricas..."
                        : "Dominio verificado. Las métricas de este panel se basan en este dominio."}
                    </div>

                    {/* BLOQUE DE MÉTRICAS */}
                    <section>
                      <h2 className="text-sm font-semibold mb-3">
                        Resumen de tráfico (últimas 24 horas)
                      </h2>

                      {metricsLoading && (
                        <div className="text-xs text-slate-400">
                          Cargando métricas…
                        </div>
                      )}

                      {metricsError && (
                        <div className="text-xs text-red-400">
                          {metricsError}
                        </div>
                      )}

                      {metrics && !metricsLoading && !metricsError && (
                        <div className="space-y-6">
                          {/* Cards principales */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                              <p className="text-[11px] text-slate-400 mb-1">
                                Peticiones totales
                              </p>
                              <p className="text-xl font-semibold">
                                {metrics.totals.totalRequests.toLocaleString()}
                              </p>
                            </div>
                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                              <p className="text-[11px] text-slate-400 mb-1">
                                Ataques bloqueados
                              </p>
                              <p className="text-xl font-semibold text-emerald-400">
                                {metrics.totals.blockedRequests.toLocaleString()}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                {(metrics.totals.totalRequests
                                  ? (metrics.totals.blockedRequests /
                                      metrics.totals.totalRequests) *
                                    100
                                  : 0
                                ).toFixed(1)}
                                % del tráfico
                              </p>
                            </div>
                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                              <p className="text-[11px] text-slate-400 mb-1">
                                Tráfico bot estimado
                              </p>
                              <p className="text-xl font-semibold text-cyan-400">
                                {metrics.totals.botRequests.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* “Gráfico” de barras horizontales simple */}
                          {metrics.hourly.length > 0 && (
                            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                              <p className="text-[11px] text-slate-400 mb-3">
                                Evolución por hora
                              </p>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {metrics.hourly.map((h) => {
                                  const total = h.totalRequests || 0;
                                  const blocked = h.blockedRequests || 0;
                                  const barWidth =
                                    maxHourlyTotal > 0
                                      ? Math.max(
                                          (total / maxHourlyTotal) * 100,
                                          5
                                        )
                                      : 0;
                                  const blockedRatio =
                                    total > 0
                                      ? (blocked / total) * 100
                                      : 0;

                                  const label = new Date(
                                    h.bucketStart
                                  ).toLocaleTimeString("es-ES", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  });

                                  return (
                                    <div
                                      key={h.bucketStart}
                                      className="flex items-center gap-3"
                                    >
                                      <span className="w-14 text-[11px] text-slate-400">
                                        {label}
                                      </span>
                                      <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">
                                        <div
                                          className="h-full bg-slate-500/70 relative"
                                          style={{ width: `${barWidth}%` }}
                                        >
                                          {blockedRatio > 0 && (
                                            <div
                                              className="absolute inset-y-0 right-0 bg-emerald-500/70"
                                              style={{
                                                width: `${Math.min(
                                                  blockedRatio,
                                                  100
                                                )}%`,
                                              }}
                                            />
                                          )}
                                        </div>
                                      </div>
                                      <span className="w-24 text-right text-[11px] text-slate-300">
                                        {total.toLocaleString()} req
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  </>
                )}

                {error && (
                  <p className="text-xs text-red-400 mt-2">Error: {error}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
