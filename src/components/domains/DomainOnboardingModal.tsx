// src/components/domains/DomainOnboardingModal.tsx
import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmitDomain: (hostname: string) => void;
};

export const DomainOnboardingModal: React.FC<Props> = ({
  open,
  onClose,
  onSubmitDomain,
}) => {
  const [hostname, setHostname] = React.useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostname.trim()) return;
    onSubmitDomain(hostname.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-50 mb-2">
          Conecta tu dominio
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Antes de poder analizar tráfico y ataques, necesitamos saber qué
          dominio quieres proteger con Zntinel.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Dominio
            </label>
            <input
              className="w-full rounded-lg bg-slate-900/80 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
              placeholder="midominio.com"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3 py-2 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800/80"
            >
              Más tarde
            </button>
            <button
              type="submit"
              className="text-xs px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
            >
              Añadir dominio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
