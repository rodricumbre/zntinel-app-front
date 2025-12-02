// src/components/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { DomainOnboardingModal } from "@/components/domains/DomainOnboardingModal";
import { useAuth } from "@/lib/auth"; // si aquí sacas el plan de la cuenta

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
  return 1; // free / trial / default
}

const Dashboard: React.FC = () => {
  const { account } = useAuth(); // asumiendo que aquí viene el plan
  const [domains, setDomains] = useState<Domain[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const maxDomains = getMaxDomainsForPlan(account?.plan);

  // 1) Cargar dominios al entrar al dashboard
  useEffect(() => {
    fetch(`${API_BASE}/domains`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const list: Domain[] = data.domains || [];
          setDomains(list);

          // si no hay ninguno → forzar popup
          if (list.length === 0) {
            setIsOnboardingOpen(true);
          }
        } else {
          setError(data.error || "API error");
          setDomains([]);
          setIsOnboardingOpen(true); // si falla, igualmente fuerzo modal
        }
      })
      .catch((err) => {
        setError(String(err));
        setDomains([]);
        setIsOnboardingOpen(true);
      });
  }, []);

  // 2) Mientras carga, no devolvemos null → loader
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
      {/* MODAL DE ONBOARDING */}
      <DomainOnboardingModal
        open={isOnboardingOpen}
        // mientras no haya dominios, el modal NO se puede cerrar
        onClose={() => {
          if (!hasAnyDomain) return;
          setIsOnboardingOpen(false);
        }}
        maxDomains={maxDomains}
        currentDomains={domains}
        onDomainCreated={(newDomain: Domain) => {
          setDomains((prev) => [...prev, newDomain]);
          setIsOnboardingOpen(false);
        }}
      />

      {/* Si no hay dominios, “por debajo” sólo dejamos un fondo neutro */}
      {!hasAnyDomain ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-slate-500">
            Añade tu primer dominio en el modal para empezar a usar Zntinel.
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          {/* HEADER + BOTÓN PARA AÑADIR MÁS DOMINIOS (si no has llegado al límite) */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold">Panel de seguridad</h1>
              <p className="text-xs text-slate-400">
                Gestiona los dominios protegidos por Zntinel.
              </p>
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

          {/* WIDGET SIMPLE CON ESTADO DEL PRIMER DOMINIO (ya verificado o pending) */}
          {domains.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm"
            >
              <div className="font-medium mb-1">
                Dominio {d.hostname}
              </div>

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
  );
};

export default Dashboard;
