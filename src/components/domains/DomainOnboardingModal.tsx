// src/components/domains/DomainOnboardingModal.tsx
import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmitDomain: (hostname: string) => void;
};

type Props = {
  open: boolean;
  forced?: boolean; // si true, sin botón de cerrar / más tarde
  loading?: boolean;
  errorMessage?: string | null;
  onSubmitDomain: (hostname: string) => void | Promise<void>;
};

export function DomainOnboardingModal({
  open,
  forced = false,
  loading = false,
  errorMessage,
  onSubmitDomain,
}: Props) {
  const [hostname, setHostname] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostname.trim()) return;
    onSubmitDomain(hostname.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-50 mb-2">
          Añade tu dominio principal
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Para empezar a proteger y analizar tu sitio, dinos cuál es tu dominio
          principal (ej. <span className="font-mono">midominio.com</span>).
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Dominio
            </label>
            <input
              type="text"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="midominio.com"
              autoFocus
            />
          </div>

          {errorMessage && (
            <p className="text-[11px] text-red-400">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
          >
            {loading ? "Guardando…" : "Continuar"}
          </button>

          {/* IMPORTANTE: si forced = true, NO ponemos botón de cerrar / más tarde */}
          {!forced && (
            <button
              type="button"
              className="w-full text-xs text-slate-400 mt-1"
            >
              Ahora no
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
