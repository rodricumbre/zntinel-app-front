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

  const maxDomains = getMaxDomainsForPlan(account?.plan);

  useEffect(() => {
    fetch(`${API_BASE}/domains`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const list: Domain[] = data.domains || [];
          setDomains(list);

          if (list.length === 0) {
            setIsOnboardingOpen(true); // fuerza modal si no hay dominios
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
      {/* MODAL */}
      <DomainOnboardingModal
        open={isOnboardingOpen}
        maxDomains={maxDomains}
        currentDomains={domains}
        onClose={() => {
          // Sólo permitimos cerrar si ya hay al menos un dominio
          if (!hasAnyDomain) return;
          setIsOnboardingOpen(false);
        }}
        onDomainCreated={(newDomain) => {
          setDomains((prev) => [...prev, newDomain]);
          // ahora sí hay dominio → se puede cerrar
          setIsOnboardingOpen(false);
        }}
      />

      <div className="max-w-4xl mx-auto">
        {/* EMPTY STATE cuando NO hay dominios */}
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
          // WIDGET ÚNICO de dominios (por ahora)
          <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-semibold">
                Dominios protegidos
              </h1>
              {domains.length < maxDomains && (
                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5 text-xs font-medium text-slate-950"
                >
                  Añadir otro dominio
                </button>
              )}
            </div>

            {domains.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm"
              >
                <div className="font-medium mb-1">{d.hostname}</div>
                {d.dns_status === "pending" ? (
                  <p className="text-slate-300 text-xs">
                    Verificación pendiente. Añade este registro TXT en tu DNS:
                    <br />
                    <code className="text-[11px]">
                      Nombre: _zntinel.{d.hostname}
                      <br />
                      Valor: {d.verification_token}
                    </code>
                  </p>
                ) : (
                  <p className="text-emerald-300 text-xs">
                    Dominio verificado. Ya podemos empezar a analizar tráfico y
                    ataques.
                  </p>
                )}
              </div>
            ))}

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
