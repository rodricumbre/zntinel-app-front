// src/components/pages/AccountUsage.tsx
import React, { useMemo } from "react";
import PageCard from "@/components/layout/PageCard";

type ClientUsage = {
  name: string;
  requests: number;
  maliciousPct: number;       // 0–1
  attacksBlocked: number;
  bandwidthSavedGB: number;
};

const clientsUsageMock: ClientUsage[] = [
  {
    name: "Tienda Uno",
    requests: 3_200_000,
    maliciousPct: 0.11,
    attacksBlocked: 352_000,
    bandwidthSavedGB: 210,
  },
  {
    name: "Agencia Web",
    requests: 2_450_000,
    maliciousPct: 0.07,
    attacksBlocked: 171_500,
    bandwidthSavedGB: 96,
  },
  {
    name: "Clínica Sol",
    requests: 1_980_000,
    maliciousPct: 0.09,
    attacksBlocked: 178_000,
    bandwidthSavedGB: 132,
  },
  {
    name: "GymX",
    requests: 1_350_000,
    maliciousPct: 0.05,
    attacksBlocked: 67_500,
    bandwidthSavedGB: 74,
  },
];

const AccountUsagePage: React.FC = () => {
  const summary = useMemo(() => {
    const totalRequests = clientsUsageMock.reduce(
      (acc, c) => acc + c.requests,
      0
    );
    const totalAttacks = clientsUsageMock.reduce(
      (acc, c) => acc + c.attacksBlocked,
      0
    );
    const totalBandwidthSaved = clientsUsageMock.reduce(
      (acc, c) => acc + c.bandwidthSavedGB,
      0
    );

    const maliciousPctGlobal =
      totalRequests > 0 ? totalAttacks / totalRequests : 0;

    // mocks de comparación inter-mensual
    const prevMonthRequests = totalRequests * 0.86;
    const prevMonthAttacks = totalAttacks * 0.91;
    const prevMonthSaved = totalBandwidthSaved * 0.8;

    const reqDeltaPct =
      prevMonthRequests > 0
        ? ((totalRequests - prevMonthRequests) / prevMonthRequests) * 100
        : 0;
    const atkDeltaPct =
      prevMonthAttacks > 0
        ? ((totalAttacks - prevMonthAttacks) / prevMonthAttacks) * 100
        : 0;
    const savedDeltaPct =
      prevMonthSaved > 0
        ? ((totalBandwidthSaved - prevMonthSaved) / prevMonthSaved) * 100
        : 0;

    return {
      totalRequests,
      totalAttacks,
      totalBandwidthSaved,
      maliciousPctGlobal,
      reqDeltaPct,
      atkDeltaPct,
      savedDeltaPct,
    };
  }, []);

  const fmtMillions = (n: number) => (n / 1_000_000).toFixed(1) + "M";
  const fmtPct = (v: number) => (v * 100).toFixed(1) + "%";
  const fmtDelta = (n: number) =>
    `${n >= 0 ? "+" : ""}${n.toFixed(1)}% vs mes anterior`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">
          Account Usage
        </h1>
        <p className="text-sm text-slate-400">
          Visión global de tráfico inspeccionado, ataques bloqueados y ahorro
          de recursos en tu cuenta.
        </p>
      </div>

      {/* cards superiores con métricas de verdad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PageCard>
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">
            Tráfico inspeccionado este mes
          </div>
          <div className="text-3xl font-semibold text-slate-50 mb-1">
            {fmtMillions(summary.totalRequests)}
          </div>
          <p className="text-xs text-slate-400">
            {fmtDelta(summary.reqDeltaPct)}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            Incluye todo el tráfico HTTP/HTTPS que atraviesa Zntinel para
            este tenant.
          </p>
        </PageCard>

        <PageCard>
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">
            Ataques bloqueados
          </div>
          <div className="text-3xl font-semibold text-emerald-400 mb-1">
            {fmtMillions(summary.totalAttacks)}
          </div>
          <p className="text-xs text-slate-400">
            {fmtPct(summary.maliciousPctGlobal)} del tráfico total clasificado
            como malicioso (WAF + Bot Management).
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            Incluye firmas WAF, reglas personalizadas, protección L7 y
            mitigación de bots.
          </p>
        </PageCard>

        <PageCard>
          <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">
            Ahorro de recursos
          </div>
          <div className="text-3xl font-semibold text-sky-400 mb-1">
            {summary.totalBandwidthSaved.toFixed(0)} GB
          </div>
          <p className="text-xs text-slate-400">
            {fmtDelta(summary.savedDeltaPct)}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            Ancho de banda y peticiones a origen evitadas gracias al caché,
            rate limiting y bloqueo precoz de ataques.
          </p>
        </PageCard>
      </div>

      {/* tabla detallada por cliente */}
      <PageCard
        title="Uso detallado por cliente"
        subtitle="Distribución de tráfico, ataques y ahorro de recursos por cada dominio/cliente gestionado."
      >
        <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/60">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800/80">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Cliente</th>
                <th className="px-4 py-2 text-left font-medium">
                  Requests inspeccionadas
                </th>
                <th className="px-4 py-2 text-left font-medium">
                  % tráfico malicioso
                </th>
                <th className="px-4 py-2 text-left font-medium">
                  Ataques bloqueados
                </th>
                <th className="px-4 py-2 text-left font-medium">
                  Ancho de banda ahorrado
                </th>
              </tr>
            </thead>
            <tbody>
              {clientsUsageMock.map((c) => (
                <tr
                  key={c.name}
                  className="border-b border-slate-800/70 last:border-0 hover:bg-slate-900/40 transition"
                >
                  <td className="px-4 py-3 text-slate-100">{c.name}</td>
                  <td className="px-4 py-3 text-slate-200">
                    {fmtMillions(c.requests)}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {fmtPct(c.maliciousPct)}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {c.attacksBlocked.toLocaleString("es-ES")}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {c.bandwidthSavedGB.toFixed(0)} GB
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageCard>
    </div>
  );
};

export default AccountUsagePage;
