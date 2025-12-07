// src/components/pages/AccountUsage.tsx
import React, { useEffect, useState } from "react";
import PageCard from "@/components/layout/PageCard";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.zntinel.com";

type AccountUsageApi = {
  success: boolean;
  account: {
    id: string;
    name: string;
    plan: string;
    status: string;
    extra_seat_packs: number;
  };
  seats: {
    used: number;
    max: number;
    base: number;
    extraPacks: number;
  };
  members: {
    total: number;
    owners: number;
    admins: number;
    members: number;
    pendingInvites: number;
  };
  mfa: {
    enabled: number;
    total: number;
    adoptionPct: number; // 0–100
  };
};

const AccountUsagePage: React.FC = () => {
  const [usage, setUsage] = useState<AccountUsageApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/account/usage`, {
          method: "GET",
          credentials: "include",
        });

        const data = (await res.json()) as AccountUsageApi;

        if (!res.ok || !data.success) {
          throw new Error(
            (data as any)?.error || `HTTP ${res.status} en /account/usage`
          );
        }

        if (!cancelled) {
          setUsage(data);
        }
      } catch (e: any) {
        console.error("[ACCOUNT_USAGE] error:", e);
        if (!cancelled) {
          setError(
            e?.message || "Error cargando el uso de la cuenta"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const fmtPct = (n: number | undefined) =>
    typeof n === "number" ? `${n.toFixed(0)}%` : "–";

  const fmtSeats = (used: number, max: number) => `${used} / ${max} asientos`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">
          Account Usage
        </h1>
        <p className="text-sm text-slate-400">
          Visión global de asientos, miembros y seguridad de acceso para tu cuenta.
        </p>
      </div>

      {loading && (
        <PageCard>
          <p className="text-sm text-slate-400">Cargando uso de la cuenta…</p>
        </PageCard>
      )}

      {error && !loading && (
        <PageCard>
          <p className="text-sm text-red-400">
            {error}
          </p>
        </PageCard>
      )}

      {usage && !loading && !error && (
        <>
          {/* Cards superiores basadas en /account/usage REAL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PageCard>
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">
                Asientos y miembros
              </div>
              <div className="text-3xl font-semibold text-slate-50 mb-1">
                {fmtSeats(usage.seats.used, usage.seats.max)}
              </div>
              <p className="text-xs text-slate-400">
                Plan <span className="font-semibold">{usage.account.plan}</span>{" "}
                · base: {usage.seats.base} · packs extra:{" "}
                {usage.seats.extraPacks}
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                Controla cuántos usuarios activos tienes frente a la capacidad
                total permitida por tu plan.
              </p>
            </PageCard>

            <PageCard>
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">
                Seguridad de acceso (MFA)
              </div>
              <div className="text-3xl font-semibold text-emerald-400 mb-1">
                {fmtPct(usage.mfa.adoptionPct)}
              </div>
              <p className="text-xs text-slate-400">
                {usage.mfa.enabled} de {usage.mfa.total} usuarios tienen MFA
                activado.
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                Un mayor porcentaje de MFA reduce el riesgo de accesos
                comprometidos al Control Center.
              </p>
            </PageCard>

            <PageCard>
              <div className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">
                Invitaciones y roles
              </div>
              <div className="text-3xl font-semibold text-sky-400 mb-1">
                {usage.members.pendingInvites}
              </div>
              <p className="text-xs text-slate-400">
                invitaciones pendientes · {usage.members.total} miembros
                totales.
              </p>
              <p className="mt-2 text-[11px] text-slate-500">
                Gestiona owners, admins y members para mantener el principio
                de mínimo privilegio.
              </p>
            </PageCard>
          </div>

          {/* tabla/resumen de roles */}
          <PageCard
            title="Distribución de roles"
            subtitle="Cómo se reparte la responsabilidad dentro de la cuenta."
          >
            <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/60">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800/80">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">
                      Rol
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Nº usuarios
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      Comentario
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800/70">
                    <td className="px-4 py-3 text-slate-100">Owners</td>
                    <td className="px-4 py-3 text-slate-200">
                      {usage.members.owners}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      Acceso completo a la cuenta, facturación y cambios
                      críticos.
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800/70">
                    <td className="px-4 py-3 text-slate-100">Admins</td>
                    <td className="px-4 py-3 text-slate-200">
                      {usage.members.admins}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      Gestión del WAF, dominios, reglas y usuarios sin tocar
                      facturación.
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-100">Members</td>
                    <td className="px-4 py-3 text-slate-200">
                      {usage.members.members}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      Acceso operativo limitado, ideal para desarrolladores y
                      soporte técnico.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </PageCard>
        </>
      )}
    </div>
  );
};

export default AccountUsagePage;
