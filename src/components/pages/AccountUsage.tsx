import React from "react";

const AccountUsage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-100">Account Usage</h1>
      <p className="text-sm text-slate-400">
        Consumo acumulado de tráfico, recursos y capacidad mensual.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 mb-1">Requests este mes</div>
          <div className="text-2xl font-semibold text-z-cyan">4.8M</div>
          <div className="mt-3 w-full bg-slate-800 h-2 rounded-lg overflow-hidden">
            <div className="h-full bg-z-cyan" style={{ width: "62%" }} />
          </div>
          <div className="text-xs text-slate-500 mt-2">62% del límite</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 mb-1">Transferencia</div>
          <div className="text-2xl font-semibold text-slate-100">128 GB</div>
          <div className="mt-3 w-full bg-slate-800 h-2 rounded-lg overflow-hidden">
            <div className="h-full bg-emerald-400" style={{ width: "41%" }} />
          </div>
          <div className="text-xs text-slate-500 mt-2">41% usado</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 mb-1">Ataques mitigados</div>
          <div className="text-2xl font-semibold text-emerald-400">74,293</div>
          <div className="text-xs text-slate-500 mt-2">Este mes</div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 mt-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Uso detallado por cliente
        </h2>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="text-left py-2">Cliente</th>
                <th className="text-left py-2">Requests</th>
                <th className="text-left py-2">Transferencia</th>
                <th className="text-left py-2">Ataques mitigados</th>
              </tr>
            </thead>
            <tbody>
              {["Tienda Uno", "Agencia Web", "Clínica Sol", "GymX"].map(
                (name, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-800 text-slate-300"
                  >
                    <td className="py-2">{name}</td>
                    <td className="py-2">{(Math.random() * 3).toFixed(2)}M</td>
                    <td className="py-2">
                      {Math.floor(Math.random() * 200) + 50} GB
                    </td>
                    <td className="py-2">
                      {Math.floor(Math.random() * 50000) + 5000}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountUsage;
