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

type HourlyPoint = {
  bucketStart: string;
  uptimePercent: number | null;
  avgTtfbMs?: number | null;
};

type RiskLevel = "low" | "medium" | "high" | "critical";

type IssueSeverity = "critical" | "high" | "medium" | "low";

type IssueSummary = {
  id: string;
  severity: IssueSeverity;
  category:
    | "tls"
    | "headers"
    | "cookies"
    | "email"
    | "admin"
    | "files"
    | "availability"
    | "other";
  title: string;
  detectedAt: string;
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

  securityScore: number | null;
  riskLevel: RiskLevel | null;
  criticalIssues: number;
  warningIssues: number;

  spfStatus: "ok" | "missing" | "invalid" | "unknown";
  dkimStatus: "ok" | "missing" | "invalid" | "unknown";
  dmarcPolicy: "none" | "quarantine" | "reject" | "invalid" | "unknown";
  dnssecStatus: "enabled" | "disabled" | "unknown";

  certDaysToExpire: number | null;
  hasExpiringCertSoon: boolean;

  topIssues: IssueSummary[];
};

const API_BASE = import.meta.env.VITE_API_URL ?? "https://api.zntinel.com";

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

function getMetricsUrl(domainId: string) {
  const ts = Date.now();
  return `${API_BASE}/domains/${encodeURIComponent(
    domainId
  )}/metrics/overview?_ts=${ts}`;
}

function mapApiMetrics(data: any): DomainMetrics {
  const totals = data?.totals || {};
  const hourlyRaw: any[] = data?.hourly || [];

  const totalChecks = Number(totals.totalRequests ?? 0);

  const hourly: HourlyPoint[] = hourlyRaw.map((h) => {
    const total = Number(h.totalRequests ?? h.total_requests ?? 0) || 0;
    const blocked = Number(h.blockedRequests ?? h.blocked_requests ?? 0) || 0;

    const uptimePercent =
      total > 0 ? ((total - blocked) / total) * 100 : null;

    return {
      bucketStart: h.bucketStart ?? h.bucket_start,
      uptimePercent,
    };
  });

  const security = data?.security || data?.overview?.security || {};
  const emailSec =
    data?.emailSecurity || data?.email || data?.domainSecurity || {};
  const cert = data?.certificate || {};
  const issues: IssueSummary[] = (data?.topIssues || []).map((i: any) => ({
    id: String(i.id ?? i.code ?? Math.random().toString(36).slice(2)),
    severity: (i.severity || "medium") as IssueSeverity,
    category: (i.category || "other") as IssueSummary["category"],
    title: String(i.title || i.message || "Issue detectado"),
    detectedAt: String(i.detectedAt || i.detected_at || data.to),
  }));

  return {
    from: data.from,
    to: data.to,
    totalChecks,
    uptimePercent:
      totals.uptimePercent != null ? Number(totals.uptimePercent) : null,
    lastStatusCode:
      totals.lastStatusCode != null ? Number(totals.lastStatusCode) : null,
    lastCheckedAt: totals.lastCheckedAt ?? null,
    avgTtfbMs:
      totals.avgTtfbMs != null ? Math.round(Number(totals.avgTtfbMs)) : null,
    p95TtfbMs:
      totals.p95TtfbMs != null ? Math.round(Number(totals.p95TtfbMs)) : null,
    okChecks: Number(totals.allowedRequests ?? 0),
    errorChecks: Number(totals.blockedRequests ?? 0),
    timeoutErrors: Number(totals.timeoutErrors ?? 0),
    networkErrors: Number(totals.networkErrors ?? 0),
    http4xxErrors: Number(totals.http4xxErrors ?? 0),
    http5xxErrors: Number(totals.http5xxErrors ?? 0),
    hourly,

    securityScore: security.score != null ? Number(security.score) : null,
    riskLevel: security.riskLevel || null,
    criticalIssues: Number(security.criticalIssues ?? 0),
    warningIssues: Number(security.warningIssues ?? 0),

    spfStatus: emailSec.spfStatus || emailSec.spf || "unknown",
    dkimStatus: emailSec.dkimStatus || emailSec.dkim || "unknown",
    dmarcPolicy: emailSec.dmarcPolicy || emailSec.dmarc || "unknown",
    dnssecStatus: emailSec.dnssecStatus || emailSec.dnssec || "unknown",

    certDaysToExpire:
      cert.daysToExpire != null ? Number(cert.daysToExpire) : null,
    hasExpiringCertSoon: Boolean(
      cert.hasExpiringCertSoon ??
        (cert.daysToExpire != null && Number(cert.daysToExpire) <= 30)
    ),

    topIssues: issues,
  };
}

const UptimeTimeline: React.FC<{ hourly: HourlyPoint[] }> = ({ hourly }) => {
  if (!hourly || hourly.length === 0) return null;

  const points = hourly.map((h, idx) => {
    const x =
      hourly.length === 1 ? 0 : (idx / (hourly.length - 1)) * 100;

    const uptime = h.uptimePercent ?? 100;
    const clamped = Math.max(0, Math.min(uptime, 100));
    const y = 100 - clamped;

    return `${x},${y}`;
  });

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-[#15151c] p-3 shadow-[0_0_18px_rgba(255,20,60,0.05)] relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent opacity-40 animate-scanLine" />
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-[#9a9aa3]">Uptime últimas 24 h</p>
        <p className="text-[10px] text-[#6e6e78]">
          Cada punto representa 1 hora
        </p>
      </div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-24 text-[#ff1133]"
      >
        <line
          x1="0"
          y1="100"
          x2="100"
          y2="100"
          stroke="rgba(148,163,184,0.35)"
          strokeWidth={0.6}
        />
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          points={points.join(" ")}
          style={{ filter: "drop-shadow(0 0 3px rgba(255,17,51,0.55))" }}
        />
      </svg>
      <div className="flex items-center gap-1 mt-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff1133] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff1133]" />
        </span>
        <p className="text-[10px] text-[#9a9aa3]">
          Recogiendo eventos en tiempo real…
        </p>
      </div>
    </div>
  );
};

function getRiskLabel(risk: RiskLevel | null): string {
  if (!risk) return "Sin evaluar";
  if (risk === "low") return "Riesgo bajo";
  if (risk === "medium") return "Riesgo medio";
  if (risk === "high") return "Riesgo alto";
  return "Riesgo crítico";
}

function getRiskBadgeClasses(risk: RiskLevel | null): string {
  if (!risk)
    return "border-white/10 bg-[#1b1b24] text-[#e2e2e6]";
  if (risk === "low")
    return "border-emerald-500/60 bg-emerald-500/10 text-emerald-300";
  if (risk === "medium")
    return "border-amber-500/60 bg-amber-500/10 text-amber-200";
  if (risk === "high")
    return "border-orange-500/60 bg-orange-500/10 text-orange-200";
  return "border-red-500/70 bg-red-500/10 text-red-200";
}

function formatPercent(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n.toFixed(1)}%`;
}

function formatDaysToExpire(days: number | null): string {
  if (days == null) return "—";
  if (days < 0) return "Caducado";
  if (days === 0) return "Hoy";
  if (days === 1) return "1 día";
  return `${days} días`;
}

const Dashboard: React.FC = () => {
  const { account } = useAuth();
  const [domains, setDomains] = useState<Domain[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [recentlyVerifiedId, setRecentlyVerifiedId] =
    useState<string | null>(null);

  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(
    null
  );

  const [metrics, setMetrics] = useState<DomainMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const maxDomains = getMaxDomainsForPlan(account?.plan);

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

  async function refreshDomainOverview(
    domainId: string,
    opts?: { manual?: boolean; triggerCheck?: boolean }
  ) {
    const domain = domains?.find((d) => d.id === domainId);

    if (!domain || domain.dns_status !== "ok") {
      setMetrics(null);
      setMetricsError(null);
      return;
    }

    const isManual = !!opts?.manual;
    const triggerCheck = !!opts?.triggerCheck;

    try {
      setMetricsLoading(true);
      setMetricsError(null);
      if (isManual) setManualRefreshing(true);

      if (triggerCheck) {
        await fetch(
          `${API_BASE}/domains/${encodeURIComponent(
            domainId
          )}/health-check-now`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          }
        ).catch((err) => {
          console.log("[overview] health-check-now error:", err);
        });
      }

      const res = await fetch(getMetricsUrl(domainId), {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMetrics(null);
        setMetricsError(
          data.error || "No se han podido cargar las métricas del dominio."
        );
        return;
      }

      const mapped = mapApiMetrics(data);

      setMetrics(mapped);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err: any) {
      console.error("[overview] refresh error:", err);
      setMetrics(null);
      setMetricsError(
        err?.message || "Error de red al cargar las métricas."
      );
    } finally {
      setMetricsLoading(false);
      if (isManual) setManualRefreshing(false);
    }
  }

  useEffect(() => {
    if (!selectedDomainId || !domains) {
      setMetrics(null);
      setMetricsError(null);
      return;
    }

    const current = domains.find((d) => d.id === selectedDomainId);
    if (!current || current.dns_status !== "ok") {
      setMetrics(null);
      setMetricsError(null);
      return;
    }

    refreshDomainOverview(selectedDomainId, {
      manual: false,
      triggerCheck: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomainId, domains]);

  useEffect(() => {
    if (!selectedDomainId) return;

    const intervalMs = 60_000;

    const id = setInterval(() => {
      refreshDomainOverview(selectedDomainId, {
        manual: false,
        triggerCheck: false,
      });
    }, intervalMs);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomainId]);

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
      <div className="min-h-screen bg-[#0f0f13] text-[#e2e2e6] flex items-center justify-center">
        Cargando tu panel de Zntinel…
      </div>
    );
  }

  const hasAnyDomain = domains.length > 0;
  const selectedDomain =
    domains.find((d) => d.id === selectedDomainId) || null;

  const currentRiskLevel: RiskLevel | null =
    metrics?.riskLevel ?? null;

  const currentSecurityScore =
    metrics?.securityScore != null ? metrics.securityScore : null;

  return (
    <div className="h-full bg-[#05050a] text-[#e2e2e6] px-8 py-4">
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

      <div className="max-w-5xl mx-auto relative">
        {/* Glow de fondo */}
        <div className="pointer-events-none absolute -top-24 -right-32 h-64 w-64 rounded-full bg-[#ff1133]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-[#0ae4ff]/10 blur-3xl" />

        {/* Header live */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.32em] text-[#6e6e78]">
              ZNTINEL · CONTROL CENTER
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight">
              Estado de seguridad y disponibilidad
            </h1>
            <p className="mt-1 text-xs text-[#9a9aa3]">
              Monitorización continua de tus dominios protegidos por Zntinel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-red-500/50 bg-red-500/10 px-3 py-1 text-[11px] text-red-200 shadow-[0_0_18px_rgba(255,0,60,0.55)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              LIVE
            </div>
          </div>
        </div>

        {!hasAnyDomain ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#15151c]/90 p-8 text-center shadow-[0_0_35px_rgba(0,0,0,0.7)]">
            <h1 className="text-xl font-semibold mb-2">
              Añade tu dominio para comenzar
            </h1>
            <p className="text-sm text-[#9a9aa3] mb-6">
              Antes de ver métricas o configurar reglas, conecta al menos
              un dominio a Zntinel.
            </p>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="rounded-lg bg-[#ff1133] hover:bg-[#ff2745] px-4 py-2 text-sm font-medium text-white shadow-[0_0_22px_rgba(255,17,51,0.5)] transition"
            >
              Añadir dominio ahora
            </button>
            {error && (
              <p className="mt-4 text-xs text-red-400">
                Error: {error}
              </p>
            )}
          </div>
        ) : (
          <>
            {/* pestañas dominios */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {domains.map((d) => {
                  const isActive = d.id === selectedDomainId;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDomainId(d.id)}
                      className={[
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
                        isActive
                          ? "bg-[#ff1133] text-white border-[#ff1133] shadow-[0_0_18px_rgba(255,17,51,0.6)]"
                          : "bg-[#1b1b24] text-[#d4d4d8] border-white/10 hover:border-[#ff1133]/40",
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
                  className="rounded-lg bg-[#1b1b24] hover:bg-[#242430] px-3 py-1.5 text-xs font-medium text-[#e2e2e6] border border-white/10"
                >
                  + Añadir dominio
                </button>
              )}
            </div>

            {/* tarjeta verificación */}
            <div className="space-y-3 mt-2 relative z-10">
              {domains
                .filter((d) => d.id === selectedDomainId)
                .map((d) => {
                  const isPending = d.dns_status === "pending";
                  const isVerified = d.dns_status === "ok";
                  const justVerified = recentlyVerifiedId === d.id;

                  const baseClasses =
                    "rounded-xl p-4 text-sm transition-all duration-500";
                  let colorClasses =
                    "border border-white/10 bg-[#15151c]/90";

                  if (isPending) {
                    colorClasses =
                      "border border-amber-500/60 bg-amber-500/10";
                  }
                  if (isVerified) {
                    colorClasses =
                      "border border-emerald-500/40 bg-emerald-500/10";
                  }
                  if (justVerified) {
                    colorClasses =
                      "border border-emerald-400 bg-emerald-500/15 shadow-[0_0_0_1px_rgba(16,185,129,0.7)] animate-pulse";
                  }

                  return (
                    <div
                      key={d.id}
                      className={`${baseClasses} ${colorClasses}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium">{d.hostname}</div>
                        {isVerified && (
                          <span className="text-[11px] rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                            Verificado
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[11px] rounded-full border border-amber-500/60 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                            Pendiente de verificación
                          </span>
                        )}
                      </div>

                      {isPending && (
                        <div className="mt-2 space-y-2">
                          <p className="text-[#e2e2e6] text-xs">
                            Añade este registro TXT en el DNS de tu dominio
                            y después pulsa “Comprobar TXT”:
                          </p>
                          <code className="block text-[11px] bg-black/40 border border-white/10 rounded-lg px-3 py-2">
                            Nombre: _zntinel.{d.hostname}
                            <br />
                            Valor: {d.verification_token}
                          </code>

                          <button
                            onClick={() => handleVerify(d)}
                            disabled={verifyingId === d.id}
                            className="mt-2 inline-flex items-center rounded-lg bg-[#ff1133] hover:bg-[#ff2745] disabled:opacity-60 px-3 py-1.5 text-xs font-medium text-white shadow-[0_0_16px_rgba(255,17,51,0.5)]"
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
              <p className="text-xs text-red-400 mt-3">
                Error: {error}
                <br />
                No se ha podido verificar el registro TXT. Prueba de nuevo en
                15s.
              </p>
            )}

            {/* OVERVIEW */}
            <div className="mt-8 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#e2e2e6]">
                  Overview del dominio seleccionado
                </h2>
                <div className="flex items-center gap-3">
                  {metrics && metrics.lastCheckedAt && (
                    <p className="text-[11px] text-[#6e6e78]">
                      Último check: {formatDateTime(metrics.lastCheckedAt)}
                    </p>
                  )}
                  {lastUpdatedAt && (
                    <p className="text-[10px] text-[#6e6e78]">
                      Refrescado desde el panel:{" "}
                      {formatDateTime(lastUpdatedAt)}
                    </p>
                  )}
                  <button
                    onClick={() =>
                      selectedDomain &&
                      refreshDomainOverview(selectedDomain.id, {
                        manual: true,
                        triggerCheck: true,
                      })
                    }
                    className="rounded-lg bg-[#1b1b24] hover:bg-[#242430] px-3 py-1.5 text-xs font-medium text-[#e2e2e6] border border-white/10 flex items-center gap-1"
                    disabled={manualRefreshing || metricsLoading}
                  >
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        manualRefreshing || metricsLoading
                          ? "bg-[#ff1133] animate-pulse"
                          : "bg-[#9a9aa3]"
                      }`}
                    />
                    {manualRefreshing || metricsLoading
                      ? "Actualizando…"
                      : "Actualizar ahora"}
                  </button>
                </div>
              </div>

              {!selectedDomain ? (
                <p className="text-xs text-[#6e6e78]">
                  Selecciona un dominio para ver sus métricas.
                </p>
              ) : selectedDomain.dns_status !== "ok" ? (
                <p className="text-xs text-[#6e6e78]">
                  Verifica el dominio para empezar a recoger métricas.
                </p>
              ) : (
                <div
                  className={[
                    "rounded-2xl bg-[#15151c]/95 p-4 border",
                    metricsLoading || manualRefreshing
                      ? "border-[#ff1133]/60 live-border"
                      : "border-white/10",
                    "shadow-[0_0_35px_rgba(0,0,0,0.8)]",
                  ].join(" ")}
                >
                  {metricsLoading && !metrics && (
                    <p className="text-xs text-[#9a9aa3]">
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
                      {/* HERO GLOBAL */}
                      <div className="mb-4 rounded-xl border border-white/10 bg-[#14141b] p-3 sm:p-4 relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff1133] to-transparent opacity-50" />
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
                          <div>
                            <p className="text-[11px] text-[#9a9aa3] mb-1">
                              Estado global
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs text-[#9a9aa3]">
                                  Seguridad:
                                </span>
                                <span className="text-sm font-semibold">
                                  {currentSecurityScore != null
                                    ? `${currentSecurityScore.toFixed(
                                        0
                                      )}/100`
                                    : "—"}
                                </span>
                              </div>
                              <span
                                className={[
                                  "text-[10px] px-2 py-0.5 rounded-full border",
                                  getRiskBadgeClasses(currentRiskLevel),
                                ].join(" ")}
                              >
                                {getRiskLabel(currentRiskLevel)}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#9a9aa3]">
                              <span>
                                Disponibilidad 24 h:{" "}
                                {formatPercent(metrics.uptimePercent)}
                              </span>
                              <span>
                                Incidencias críticas:{" "}
                                {metrics.criticalIssues ?? 0}
                              </span>
                              <span>
                                Avisos: {metrics.warningIssues ?? 0}
                              </span>
                            </div>
                          </div>
                          <div className="text-[11px] text-[#9a9aa3] space-y-1">
                            <p>
                              Ventana analizada:{" "}
                              {formatDateTime(metrics.from)} –{" "}
                              {formatDateTime(metrics.to)}
                            </p>
                            {metrics.certDaysToExpire != null && (
                              <p>
                                Certificado:{" "}
                                {formatDaysToExpire(
                                  metrics.certDaysToExpire
                                )}
                                {metrics.hasExpiringCertSoon &&
                                  " · revisar"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CARDS PRINCIPALES */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
                        <div className="rounded-xl bg-[#15151c] border border-white/10 p-3 shadow-[0_0_18px_rgba(255,17,51,0.05)]">
                          <p className="text-[11px] text-[#9a9aa3] mb-1">
                            Ciberseguridad
                          </p>
                          <p className="text-lg font-semibold mb-1 text-white">
                            {currentSecurityScore != null
                              ? `${currentSecurityScore.toFixed(0)}/100`
                              : "—"}
                          </p>
                          <p className="text-[10px] text-[#9a9aa3]">
                            Riesgo: {getRiskLabel(currentRiskLevel)}
                          </p>
                          <p className="text-[10px] text-[#9a9aa3] mt-1">
                            Críticos: {metrics.criticalIssues ?? 0} · Avisos:{" "}
                            {metrics.warningIssues ?? 0}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#15151c] border border-white/10 p-3">
                          <p className="text-[11px] text-[#9a9aa3] mb-1">
                            Disponibilidad
                          </p>
                          <p className="text-lg font-semibold text-emerald-400">
                            {metrics.uptimePercent === null
                              ? "—"
                              : `${metrics.uptimePercent.toFixed(1)}%`}
                          </p>
                          <p className="text-[10px] text-[#9a9aa3] mt-1">
                            TTFB medio:{" "}
                            {metrics.avgTtfbMs != null
                              ? `${metrics.avgTtfbMs} ms`
                              : "—"}
                          </p>
                          <p className="text-[10px] text-[#9a9aa3]">
                            p95:{" "}
                            {metrics.p95TtfbMs != null
                              ? `${metrics.p95TtfbMs} ms`
                              : "—"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#15151c] border border-white/10 p-3">
                          <p className="text-[11px] text-[#9a9aa3] mb-1">
                            Email y dominio
                          </p>
                          <p className="text-[10px] text-[#d4d4d8] leading-relaxed">
                            SPF: {metrics.spfStatus.toUpperCase()}
                            <br />
                            DKIM: {metrics.dkimStatus.toUpperCase()}
                            <br />
                            DMARC: {metrics.dmarcPolicy.toUpperCase()}
                            <br />
                            DNSSEC: {metrics.dnssecStatus.toUpperCase()}
                          </p>
                          <p className="text-[10px] text-[#9a9aa3] mt-1">
                            Protege frente a suplantación de correo y fraude.
                          </p>
                        </div>
                      </div>

                      <UptimeTimeline hourly={metrics.hourly} />

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-4">
                        <div className="rounded-xl bg-[#15151c] border border-white/10 p-3">
                          <p className="text-[11px] text-[#9a9aa3] mb-1">
                            Tiempo de respuesta medio (TTFB)
                          </p>
                          <p className="text-lg font-semibold">
                            {metrics.avgTtfbMs === null
                              ? "—"
                              : `${metrics.avgTtfbMs} ms`}
                          </p>
                          <p className="text-[10px] text-[#9a9aa3] mt-1">
                            Media de todos los checks.
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#15151c] border border-white/10 p-3">
                          <p className="text-[11px] text-[#9a9aa3] mb-1">
                            Latencia p95
                          </p>
                          <p className="text-lg font-semibold">
                            {metrics.p95TtfbMs === null
                              ? "—"
                              : `${metrics.p95TtfbMs} ms`}
                          </p>
                          <p className="text-[10px] text-[#9a9aa3] mt-1">
                            El 95% de las respuestas fue más rápido que esto.
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#15151c] border border-white/10 p-3">
                          <p className="text-[11px] text-[#9a9aa3] mb-1">
                            Último estado
                          </p>
                          <p className="text-lg font-semibold">
                            {metrics.lastStatusCode ?? "—"}
                          </p>
                          <p className="text-[10px] text-[#9a9aa3] mt-1">
                            Checks totales: {metrics.totalChecks}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#15151c] border border-white/10 p-3">
                          <p className="text-[11px] text-[#9a9aa3] mb-1">
                            Checks con error
                          </p>
                          <p className="text-lg font-semibold">
                            {metrics.errorChecks ?? 0}
                          </p>
                          <p className="text-[10px] text-[#9a9aa3] mt-1">
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
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 text-xs">
                        <div className="rounded-xl bg-[#15151c] border border-white/10 p-3 sm:col-span-2">
                          <p className="text-[11px] text-[#9a9aa3] mb-2">
                            Principales issues detectados
                          </p>
                          {metrics.topIssues && metrics.topIssues.length > 0 ? (
                            <div className="space-y-1">
                              {metrics.topIssues.slice(0, 5).map((issue) => {
                                const sevColor =
                                  issue.severity === "critical"
                                    ? "text-red-300 border-red-500/60 bg-red-500/10"
                                    : issue.severity === "high"
                                    ? "text-orange-200 border-orange-500/60 bg-orange-500/10"
                                    : issue.severity === "medium"
                                    ? "text-amber-200 border-amber-500/40 bg-amber-500/10"
                                    : "text-slate-200 border-slate-600 bg-slate-800/60";
                                return (
                                  <div
                                    key={issue.id}
                                    className="flex items-center justify-between gap-2 rounded-lg bg-[#111118] border border-white/10 px-2 py-1.5"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span
                                        className={[
                                          "text-[9px] px-1.5 py-0.5 rounded-full border whitespace-nowrap",
                                          sevColor,
                                        ].join(" ")}
                                      >
                                        {issue.severity.toUpperCase()}
                                      </span>
                                      <p className="text-[11px] text-slate-200 truncate">
                                        {issue.title}
                                      </p>
                                    </div>
                                    <p className="text-[9px] text-[#6e6e78] whitespace-nowrap">
                                      {formatDateTime(issue.detectedAt)}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[10px] text-[#6e6e78]">
                              No se han registrado issues detallados en esta
                              ventana. Cuando el motor de seguridad detecte
                              problemas, aparecerán aquí.
                            </p>
                          )}
                        </div>

                        <div className="rounded-xl bg-[#15151c] border border-white/10 p-3">
                          <p className="text-[11px] text-[#9a9aa3] mb-1">
                            Tipos de incidencias técnicas
                          </p>
                          <p className="text-[10px] text-[#d4d4d8] leading-relaxed">
                            Timeouts / red: {metrics.timeoutErrors} · HTTP 5xx:{" "}
                            {metrics.http5xxErrors} · HTTP 4xx / WAF:{" "}
                            {metrics.http4xxErrors}
                          </p>
                          <p className="text-[10px] text-[#9a9aa3] mt-1">
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
                      <p className="text-xs text-[#6e6e78]">
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
