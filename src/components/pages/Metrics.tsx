// src/pages/AccountUsage.tsx
import React from "react";

const Metrics: React.FC = () => {
  return (
    <div className="text-slate-200 space-y-4">
      <h2 className="text-xl font-semibold">Account Usage</h2>
      <p className="text-sm text-slate-400">
        Aquí mostraremos el uso de asientos, miembros e invites tirando de
        <code className="mx-1 text-[11px] px-1 py-0.5 bg-slate-900 rounded">
          GET /account/usage
        </code>
        de tu API.
      </p>
    </div>
  );
};

export default Metrics;
