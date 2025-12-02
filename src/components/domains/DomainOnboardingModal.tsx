// src/components/domains/DomainOnboardingModal.tsx
import React, { useState } from "react";

type Props = {
  open: boolean;
  forced?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
  onSubmitDomain: (hostname: string) => void | Promise<void>;
  onClose?: () => void;
};


type Domain = {
  id: string;
  hostname: string;
  dns_status: "pending" | "ok";
  verification_token: string;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "https://api.zntinel.com";

export const DomainOnboardingModal: React.FC<Props> = ({
  open,
  maxDomains,
  currentDomains,
  onClose,
  onDomainCreated,
}) => {
  const [hostname, setHostname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const remaining = maxDomains - currentDomains.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hostname.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/domains`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "No se ha podido crear el dominio");
      } else {
        onDomainCreated(data.domain); // 👉 notificamos al padre
        // el padre ya se encarga de cerrar si toca
      }
    } catch (err: any) {
      setError(err.message || "Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      // no onClick en el backdrop, para que no se pueda cerrar pulsando fuera
    >
      <div className="w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 p-8 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-50 mb-2">
          Añade tu dominio principal
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Antes de usar el panel, dinos cuál es tu dominio principal
          (ej. <span className="text-slate-200">midominio.com</span>).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Dominio
            </label>
            <input
              type="text"
              autoFocus
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-cyan-500"
              placeholder="midominio.com"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !hostname.trim() || remaining <= 0}
            className="w-full rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-950 mt-2"
          >
            {loading ? "Guardando..." : "Continuar"}
          </button>

          {/* Importante: NO mostramos botón de cancelar ni icono de cerrar */}
          <p className="mt-3 text-[11px] text-slate-500 text-center">
            Te quedan {remaining} dominio(s) disponibles en tu plan.
          </p>
        </form>
      </div>
    </div>
  );
};
