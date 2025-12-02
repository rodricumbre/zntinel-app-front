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
  const [error, setError] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // para loading del botón “Comprobar TXT”
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  // para animación verde durante 5 s
  const [recentlyVerifiedId, setRecentlyVerifiedId] = useState<string | null>(
    null
  );

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

      // si el backend devuelve verified=true y status ok
      if (data.verified && data.status === "ok") {
        setDomains((prev) =>
          prev.map((d) =>
            d.id === domain.id ? { ...d, dns_status: "ok" } : d
          )
        );
        setRecentlyVerifiedId(domain.id);

        // quitamos la animación verde a los 5 s
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      {/* Modal de alta de dominio */}
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
          setIsOnboardingOpen(false);
        }}
      />

      <div className="max-w-4xl mx-auto">
        {!hasAnyDomain ? (
          // Estado vacío (sin dominios)
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
          // Listado / tarjetas de dominios
          <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-semibold">Dominios protegidos</h1>
              {domains.length < maxDomains && (
                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5 text-xs font-medium text-slate-950"
                >
                  Añadir otro dominio
                </button>
              )}
            </div>

            {domains.map((d) => {
              const isPending = d.dns_status === "pending";
              const isVerified = d.dns_status === "ok";
              const justVerified = recentlyVerifiedId === d.id;

              const baseClasses =
                "rounded-xl p-4 text-sm transition-all duration-500";
              let colorClasses =
                "border border-slate-800 bg-slate-900/80"; // por defecto

              if (isPending) {
                colorClasses =
                  "border border-amber-500/60 bg-amber-500/5";
              }

              if (isVerified) {
                colorClasses =
                  "border border-emerald-500/40 bg-emerald-500/5";
              }

              if (justVerified) {
                // animación verde intensa durante 5s
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

            {error && (
              <p className="text-xs text-red-400 mt-2">Error: {error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
