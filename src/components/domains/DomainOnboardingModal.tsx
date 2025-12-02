// src/components/domains/DomainOnboardingModal.tsx
import React, { useState } from "react";

type Domain = {
  id: string;
  hostname: string;
  dns_status: "pending" | "ok";
  verification_token: string;
};

type DomainOnboardingModalProps = {
  open: boolean;
  maxDomains: number;
  currentDomains: Domain[];
  onDomainCreated: (domain: Domain) => void;
  onClose?: () => void;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "https://api.zntinel.com";

export const DomainOnboardingModal: React.FC<DomainOnboardingModalProps> = ({
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
    if (!hostname.trim() || loading || remaining <= 0) return;

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
        onDomainCreated(data.domain);
        // el padre decide si cierra o no
        setHostname("");
      }
    } catch (err: any) {
      setError(err.message || "Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
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

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !hostname.trim() || remaining <= 0}
            className="w-full rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-950 mt-2"
          >
            {loading ? "Guardando..." : "Continuar"}
          </button>

          <p className="mt-3 text-[11px] text-slate-500 text-center">
            Te quedan {remaining} dominio(s) disponibles en tu plan.
          </p>

          {/* opcional: si ya hay dominios, podrías dejar un botón pequeño de cerrar */}
          {currentDomains.length > 0 && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full text-[11px] text-slate-500 hover:text-slate-300"
            >
              Cerrar
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
