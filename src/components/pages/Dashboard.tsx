// src/pages/Dashboard.tsx
import React from "react";

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-100">Overview</h2>
      <p className="text-sm text-slate-400">
        Resumen de tráfico, ataques bloqueados y estado general de tu cuenta.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 mb-1">Requests 24h</div>
          <div className="text-2xl font-semibold text-slate-100">128.4k</div>
          <div className="text-xs text-emerald-400 mt-1">+12.3% vs ayer</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 mb-1">Ataques bloqueados</div>
          <div className="text-2xl font-semibold text-z-cyan">8.742</div>
          <div className="text-xs text-slate-500 mt-1">
            Basado en tus custom rules
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 mb-1">Uptime</div>
          <div className="text-2xl font-semibold text-emerald-400">99.99%</div>
          <div className="text-xs text-slate-500 mt-1">
            Todas las propiedades operativas
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
