import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Search,
  Filter,
  UserCheck,
  UserX,
  X,               // ⬅ nuevo
} from "lucide-react";
import PageCard from "@/components/layout/PageCard";
import { useAuth } from "@/lib/auth";   // ⬅ nuevo


const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "https://api.zntinel.com";

type RoleId = "owner" | "admin" | "member" | string;

type Member = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: RoleId;
  status?: "active" | "invited" | "disabled" | string;
  last_login_at?: string | null;
  created_at?: string;
  has_2fa?: boolean | null;
};

type MembersApiResponse = {
  success: boolean;
  members?: Member[];
  // opcional: si en tu API devuelves límites de seats, lo pintamos
  limits?: {
    max_seats?: number | null;
  };
  error?: string;
};

const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [limits, setLimits] = useState<MembersApiResponse["limits"] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleId | "all">("all");
  const { user } = useAuth();

// --- estado MFA personal ---
const [mfaStatus, setMfaStatus] = useState<{ enabled: boolean } | null>(null);
const [mfaLoading, setMfaLoading] = useState(false);
const [mfaModalOpen, setMfaModalOpen] = useState(false);
const [mfaQrSvg, setMfaQrSvg] = useState<string | null>(null);
const [mfaSecret, setMfaSecret] = useState<string | null>(null);
const [mfaCode, setMfaCode] = useState("");
const [mfaError, setMfaError] = useState<string | null>(null);
const [mfaStep, setMfaStep] = useState<"idle" | "init" | "verify">("idle");


  useEffect(() => {
  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/members`, {
        credentials: "include",
      });
      const data: MembersApiResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al cargar los miembros");
      }

      const raw = (data.members ?? []) as any[];

      const normalized: Member[] = raw.map((row) => {
        const u = row.user || {};
        return {
          id: row.id,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          role: row.role,
          status: "active",                  // de momento todo activo
          last_login_at: u.last_login_at ?? null,
          created_at: row.created_at,
          has_2fa: !!u.mfa_enabled,
        };
      });

      setMembers(normalized);
      setLimits(data.limits ?? null);
    } catch (e: any) {
      console.error("[MEMBERS] load error:", e);
      setError(e?.message || "No se pudieron cargar los miembros.");
    } finally {
      setLoading(false);
    }
  };

  load();
}, []);


useEffect(() => {
  if (user) {
    setMfaStatus({ enabled: !!(user as any).mfa_enabled });
  }
}, [user]);


const openMfaModal = async () => {
  try {
    setMfaLoading(true);
    setMfaError(null);
    setMfaModalOpen(true);
    setMfaStep("init");

    const res = await fetch(`${API_BASE}/auth/mfa/setup`, {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "No se pudo iniciar la configuración MFA");
    }

    setMfaQrSvg(data.qr_svg ?? null);
    setMfaSecret(data.secret ?? null);
    setMfaStep("verify");
  } catch (e: any) {
    console.error("[MFA] init error:", e);
    setMfaError(e?.message || "Error iniciando la configuración MFA.");
  } finally {
    setMfaLoading(false);
  }
};

const verifyMfa = async () => {
  if (!mfaCode.trim()) return;
  try {
    setMfaLoading(true);
    setMfaError(null);

    const res = await fetch(`${API_BASE}/auth/mfa/confirm`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: mfaCode.trim() }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Código incorrecto, inténtalo de nuevo.");
    }

    setMfaStatus({ enabled: true });
    setMfaModalOpen(false);
    setMfaCode("");
    setMfaQrSvg(null);
    setMfaSecret(null);
    setMfaStep("idle");
  } catch (e: any) {
    console.error("[MFA] verify error:", e);
    setMfaError(e?.message || "No se pudo verificar el código.");
  } finally {
    setMfaLoading(false);
  }
};

const disableMfa = async () => {
  try {
    setMfaLoading(true);
    setMfaError(null);

    const res = await fetch(`${API_BASE}/auth/mfa/disable`, {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "No se pudo desactivar MFA.");
    }

    setMfaStatus({ enabled: false });
  } catch (e: any) {
    console.error("[MFA] disable error:", e);
    setMfaError(e?.message || "Error al desactivar MFA.");
  } finally {
    setMfaLoading(false);
  }
};



  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesRole =
        roleFilter === "all" ? true : m.role === roleFilter;
      const q = search.trim().toLowerCase();
      if (!q) return matchesRole;

      const name = `${m.first_name ?? ""} ${m.last_name ?? ""}`.toLowerCase();
      const email = m.email.toLowerCase();

      const matchesSearch =
        name.includes(q) || email.includes(q) || m.role.toLowerCase().includes(q);

      return matchesRole && matchesSearch;
    });
  }, [members, search, roleFilter]);

  // --- métricas agregadas ---
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter(
      (m) => (m.status ?? "active") === "active"
    ).length;
    const disabled = members.filter(
      (m) => (m.status ?? "") === "disabled"
    ).length;
    const invited = members.filter(
      (m) => (m.status ?? "") === "invited"
    ).length;

    const owners = members.filter((m) => m.role === "owner").length;
    const admins = members.filter((m) => m.role === "admin").length;
    const membersRole = members.filter((m) => m.role === "member").length;

    const with2FA = members.filter((m) => !!m.has_2fa).length;
    const twoFaRate = total > 0 ? (with2FA / total) * 100 : 0;

    // usuarios inactivos (p.ej. > 30 días sin login)
    const now = Date.now();
    const stale = members.filter((m) => {
      if (!m.last_login_at) return true;
      const diffDays =
        (now - new Date(m.last_login_at).getTime()) /
        (1000 * 60 * 60 * 24);
      return diffDays > 30;
    }).length;

    return {
      total,
      active,
      disabled,
      invited,
      owners,
      admins,
      membersRole,
      with2FA,
      twoFaRate,
      stale,
    };
  }, [members]);

  const seatInfo = useMemo(() => {
    const maxSeats = limits?.max_seats ?? null;
    if (!maxSeats) return null;

    const used = stats.total;
    const remaining = Math.max(0, maxSeats - used);
    const usagePercent =
      maxSeats > 0 ? Math.min(100, (used / maxSeats) * 100) : 0;

    return {
      maxSeats,
      used,
      remaining,
      usagePercent,
    };
  }, [limits, stats.total]);

  // --- helpers UI ---
  const roleLabel = (role: RoleId) => {
    switch (role) {
      case "owner":
        return "Owner";
      case "admin":
        return "Admin";
      case "member":
        return "Member";
      default:
        return role;
    }
  };

  const roleBadgeClass = (role: RoleId) => {
    switch (role) {
      case "owner":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/40";
      case "admin":
        return "bg-sky-500/10 text-sky-300 border-sky-500/40";
      case "member":
        return "bg-slate-700/50 text-slate-200 border-slate-500/60";
      default:
        return "bg-slate-800/60 text-slate-200 border-slate-600/60";
    }
  };

  const statusBadge = (statusRaw?: string) => {
    const status = (statusRaw ?? "active") as Member["status"];
    if (status === "disabled") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/50 bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-200">
          <UserX className="w-3 h-3" />
          Deshabilitado
        </span>
      );
    }
    if (status === "invited") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/60 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200">
          <Mail className="w-3 h-3" />
          Invitación pendiente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">
        <UserCheck className="w-3 h-3" />
        Activo
      </span>
    );
  };

  const formatRelative = (iso: string | null | undefined) => {
    if (!iso) return "Nunca ha iniciado sesión";
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    const diffHours = diffMinutes / 60;
    const diffDays = diffHours / 24;

    if (diffMinutes < 60) return `Hace ${Math.round(diffMinutes)} min`;
    if (diffHours < 48) return `Hace ${Math.round(diffHours)} h`;
    return `Hace ${Math.round(diffDays)} días`;
  };

  const twoFaChip = (has2FA?: boolean | null) =>
    has2FA ? (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">
        <KeyRound className="w-3 h-3" />
        2FA activo
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/60 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-100">
        <AlertTriangle className="w-3 h-3" />
        2FA no configurado
      </span>
    );

  return (
    <div className="space-y-6">
      {/* Intro + modelo de permisos */}
      <PageCard
        title="Miembros y permisos"
        subtitle="Gestiona quién puede acceder al panel de Zntinel y qué nivel de control tiene sobre tus dominios, reglas y métricas."
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="space-y-3 lg:col-span-2 text-sm text-slate-300">
            <p>
              Esta vista centraliza todo lo relativo a{" "}
              <span className="font-medium text-sky-200">
                identidad, permisos y seguridad de acceso
              </span>{" "}
              a tu cuenta de Zntinel.
            </p>
            <p>
              Cada persona se asocia a un{" "}
              <span className="font-medium text-slate-100">rol</span> y un{" "}
              <span className="font-medium text-slate-100">
                estado de acceso
              </span>{" "}
              (activo, invitado o deshabilitado). Aquí podrás ver de un vistazo
              quién administra la seguridad, qué usuarios son puramente
              operativos y qué cuentas deberían revisarse.
            </p>
            <p className="text-slate-400 text-xs">
              Zntinel recomienda aplicar{" "}
              <span className="text-slate-100">
                principio de mínimo privilegio
              </span>
              : solo Owners para decisiones críticas (facturación, borrado de
              datos), pocos Admins para la operación diaria y el resto como
              Members con permisos acotados.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 mb-1">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              Modelo de permisos Zntinel
            </div>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex items-center rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200 font-medium">
                  Owner
                </span>
                <p className="text-[11px] text-slate-300">
                  Control total de la cuenta: facturación, dominios, reglas,
                  miembros y plan. Idealmente 1–2 por organización.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex items-center rounded-full border border-sky-500/60 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-200 font-medium">
                  Admin
                </span>
                <p className="text-[11px] text-slate-300">
                  Operación diaria: gestión de dominios, reglas WAF, bots y
                  revisiones de seguridad. No deberían tocar facturación.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex items-center rounded-full border border-slate-600/70 bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-100 font-medium">
                  Member
                </span>
                <p className="text-[11px] text-slate-300">
                  Acceso limitado a métricas, dashboards y lectura de logs.
                  Perfecto para perfiles de marketing, negocio o soporte
                  técnico.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageCard>
      {user && (
  <PageCard
    title="MFA para tu cuenta"
    subtitle="Protege el acceso al panel con un segundo factor (TOTP, Google Authenticator, etc.)."
  >
    <div className="flex flex-col md:flex-row md:items-center gap-3 text-sm">
      <div className="flex-1 space-y-1">
        <p className="text-slate-200">
          Estás autenticado como{" "}
          <span className="font-semibold text-sky-200">
            {user.first_name || user.last_name
              ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
              : user.email}
          </span>
          .
        </p>
        <p className="text-slate-400 text-xs">
          Activar MFA añade una capa adicional sobre usuario/contraseña. Cada
          vez que accedas al Control Center, Zntinel te pedirá un código de 6
          dígitos generado en tu app de autenticación.
        </p>
        {mfaStatus?.enabled ? (
          <p className="text-xs text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            MFA está actualmente{" "}
            <span className="font-semibold">activado</span> en tu cuenta.
          </p>
        ) : (
          <p className="text-xs text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            MFA todavía{" "}
            <span className="font-semibold">no está configurado</span> en tu
            usuario. Es muy recomendable activarlo.
          </p>
        )}
        {mfaError && (
          <p className="text-[11px] text-rose-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> {mfaError}
          </p>
        )}
      </div>

      <div className="flex flex-col items-start gap-2">
        {!mfaStatus?.enabled ? (
          <button
            type="button"
            onClick={openMfaModal}
            disabled={mfaLoading}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/70 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-100 hover:bg-emerald-500/20 transition disabled:opacity-60"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {mfaLoading ? "Iniciando..." : "Configurar MFA ahora"}
          </button>
        ) : (
          <button
            type="button"
            onClick={disableMfa}
            disabled={mfaLoading}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-200 hover:border-rose-500/70 hover:text-rose-200 hover:bg-slate-900/90 transition disabled:opacity-60"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {mfaLoading ? "Actualizando..." : "Desactivar MFA"}
          </button>
        )}
        <span className="text-[10px] text-slate-500 max-w-xs">
          Solo afecta a tu usuario. La adopción global se sigue midiendo en el
          gráfico superior de “Adopción 2FA”.
        </span>
      </div>
    </div>
  </PageCard>
)}


      {/* Resumen de asientos y seguridad */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <PageCard>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              Miembros activos
            </div>
          </div>
          <div className="text-2xl font-semibold text-slate-50">
            {stats.active}
            <span className="text-sm text-slate-500 ml-1">
              / {stats.total || "—"}
            </span>
          </div>
          {seatInfo && (
            <p className="mt-1 text-[11px] text-slate-400">
              {seatInfo.used} de {seatInfo.maxSeats} seats usados ·{" "}
              <span className="text-slate-100">
                {seatInfo.remaining} libres
              </span>
            </p>
          )}
          {!seatInfo && (
            <p className="mt-1 text-[11px] text-slate-400">
              Incluye todos los usuarios con acceso al Control Center.
            </p>
          )}
        </PageCard>

        <PageCard>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              Adopción 2FA
            </div>
          </div>
          <div className="text-2xl font-semibold text-slate-50">
            {stats.twoFaRate.toFixed(0)}%
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {stats.with2FA} usuarios con 2FA activado ·{" "}
            <span className="text-slate-100">
              {stats.total - stats.with2FA} sin proteger
            </span>
          </p>
        </PageCard>

        <PageCard>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Cuentas inactivas
            </div>
          </div>
          <div className="text-2xl font-semibold text-slate-50">
            {stats.stale}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Usuarios sin actividad en los últimos 30 días. Revisa si deberías
            deshabilitarlos.
          </p>
        </PageCard>

        <PageCard>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              Distribución de roles
            </div>
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <p>
              Owners:{" "}
              <span className="text-slate-50 font-medium">
                {stats.owners}
              </span>
            </p>
            <p>
              Admins:{" "}
              <span className="text-slate-50 font-medium">
                {stats.admins}
              </span>
            </p>
            <p>
              Members:{" "}
              <span className="text-slate-50 font-medium">
                {stats.membersRole}
              </span>
            </p>
          </div>
        </PageCard>
      </div>

      {/* Tabla de miembros */}
      <PageCard
        title="Miembros de la cuenta"
        subtitle="Personas con acceso al Control Center de Zntinel."
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, email o rol..."
                className="w-full rounded-lg bg-slate-950/70 border border-slate-800/80 pl-7 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400/70 focus:ring-1 focus:ring-sky-500/50"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Rol:</span>
              <div className="flex items-center gap-1.5">
                {(["all", "owner", "admin", "member"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r === "all" ? "all" : r)}
                    className={[
                      "px-2.5 py-0.5 rounded-full border text-[11px] transition",
                      roleFilter === r
                        ? "border-sky-400/70 bg-sky-500/10 text-sky-100"
                        : "border-slate-700/70 bg-slate-900/70 text-slate-300 hover:border-sky-400/50 hover:text-sky-100",
                    ].join(" ")}
                  >
                    {r === "all" ? "Todos" : roleLabel(r)}
                  </button>
                ))}
              </div>
            </div>

            <div className="ml-auto">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/70 bg-sky-500/10 px-3 py-1.5 text-[11px] text-sky-100 hover:bg-sky-500/20 transition"
                // TODO: abrir modal de invitación cuando lo implementes
              >
                <UserPlus className="w-3.5 h-3.5" />
                Invitar miembro
              </button>
            </div>
          </div>

          <div className="mt-2 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/60">
            {loading && (
              <div className="py-10 text-center text-sm text-slate-400">
                Cargando miembros...
              </div>
            )}

            {!loading && error && (
              <div className="py-6 flex items-center justify-center gap-2 text-sm text-rose-300">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && filteredMembers.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-400">
                No hay miembros que coincidan con el filtro actual.
              </div>
            )}

            {!loading && !error && filteredMembers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800/80">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">
                        Usuario
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        Rol
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        Último acceso
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        Estado
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        Seguridad
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((m) => {
                      const fullName =
                        `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() ||
                        m.email;
                      return (
                        <tr
                          key={m.id}
                          className="border-b border-slate-800/70 last:border-0 hover:bg-slate-900/40 transition"
                        >
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-slate-100 font-medium">
                                {fullName}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {m.email}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={[
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]",
                                roleBadgeClass(m.role),
                              ].join(" ")}
                            >
                              {roleLabel(m.role)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-300">
                            {formatRelative(m.last_login_at)}
                          </td>
                          <td className="px-4 py-3">
                            {statusBadge(m.status)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {twoFaChip(m.has_2fa)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </PageCard>

      {/* Recomendaciones de seguridad basadas en los datos */}
      <PageCard
        title="Recomendaciones de seguridad para tus miembros"
        subtitle="Consejos rápidos basados en la distribución de roles, actividad y 2FA."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-200">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              Higiene de cuentas
            </div>
            <p>
              Tienes{" "}
              <span className="font-semibold text-slate-50">
                {stats.stale} usuarios inactivos
              </span>{" "}
              (sin actividad &gt; 30 días). Revisa si siguen en la empresa y
              considera{" "}
              <span className="text-rose-300">
                deshabilitar o rotar sus credenciales
              </span>
              .
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              Autenticación reforzada
            </div>
            <p>
              La adopción actual de 2FA es de{" "}
              <span className="font-semibold text-slate-50">
                {stats.twoFaRate.toFixed(0)}%
              </span>
              . El objetivo recomendado para cuentas de seguridad es{" "}
              <span className="text-emerald-300">≥ 90%</span>. Prioriza activar
              2FA en Owners y Admins.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              Superficie de riesgo
            </div>
            <p>
              Actualmente tienes{" "}
              <span className="font-semibold text-slate-50">
                {stats.owners} Owners
              </span>{" "}
              y{" "}
              <span className="font-semibold text-slate-50">
                {stats.admins} Admins
              </span>
              . En equipos pequeños suele bastar con{" "}
              <span className="text-sky-300">1–2 Owners</span> y{" "}
              <span className="text-sky-300">2–4 Admins</span>. El resto
              deberían operar como Members siempre que sea posible.
            </p>
          </div>
        </div>
      </PageCard>
      {/* Modal MFA */}
{mfaModalOpen && (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/95 p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Configurar MFA (TOTP)
          </h2>
          <p className="text-[11px] text-slate-400">
            Escanea el código QR con tu app de autenticación y luego introduce
            un código de 6 dígitos para activarlo.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-700 p-1 text-slate-400 hover:text-slate-100 hover:border-slate-500"
          onClick={() => {
            setMfaModalOpen(false);
            setMfaCode("");
            setMfaQrSvg(null);
            setMfaSecret(null);
            setMfaStep("idle");
            setMfaError(null);
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {mfaStep === "init" && (
        <div className="py-6 text-center text-sm text-slate-400">
          Iniciando configuración MFA...
        </div>
      )}

      {mfaStep === "verify" && (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            {mfaQrSvg ? (
              <div
                className="p-2 bg-slate-900 rounded-xl"
                dangerouslySetInnerHTML={{ __html: mfaQrSvg }}
              />
            ) : (
              <div className="text-xs text-slate-400">
                Escanea el QR proporcionado por la API.
              </div>
            )}
          </div>

          {mfaSecret && (
            <p className="text-[11px] text-slate-500 text-center">
              Si no puedes escanear el código, añade manualmente esta clave en
              tu app:{" "}
              <span className="font-mono text-slate-100">{mfaSecret}</span>
            </p>
          )}

          <div className="space-y-2">
            <label className="text-[11px] text-slate-300">
              Introduce un código de 6 dígitos generado por tu app
            </label>
            <input
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              maxLength={6}
              placeholder="000000"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/70 focus:ring-1 focus:ring-emerald-500/50 tracking-[0.3em] text-center font-mono"
            />
          </div>

          {mfaError && (
            <p className="text-[11px] text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> {mfaError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setMfaModalOpen(false);
                setMfaCode("");
                setMfaQrSvg(null);
                setMfaSecret(null);
                setMfaStep("idle");
                setMfaError(null);
              }}
              className="text-[11px] px-3 py-1.5 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-900"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={mfaLoading || mfaCode.trim().length < 6}
              onClick={verifyMfa}
              className="text-[11px] px-3 py-1.5 rounded-full border border-emerald-500/70 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-60"
            >
              {mfaLoading ? "Verificando..." : "Activar MFA"}
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}

    </div>
  );
};

export default MembersPage;
