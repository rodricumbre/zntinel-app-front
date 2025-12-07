// src/components/pages/SettingsPage.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Users, Mail, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.zntinel.com";

const settingsTabs = [
  { id: "profile", label: "Perfil" },
  { id: "organization", label: "Organización" },
  { id: "members", label: "Miembros" },
  { id: "invites", label: "Invitar miembros" },
  { id: "security", label: "Seguridad" }, // <- nueva pestaña
];

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("invites");
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <div className="h-full flex flex-col px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-cyan-500/10">
          <Settings className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            Ajustes de la cuenta
          </h1>
          <p className="text-sm text-slate-400">
            Gestiona miembros, seguridad e información de tu organización.
          </p>
        </div>
      </div>

      {/* Submenú de ajustes */}
      <div className="border-b border-slate-800 mb-4">
        <div className="flex gap-1">
          {settingsTabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "invites") {
                    setShowInviteModal(true);
                  }
                }}
                className={`relative px-3 py-2 text-sm rounded-t-lg transition
                ${
                  active
                    ? "text-cyan-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
                {active && (
                  <motion.div
                    layoutId="settings-underline"
                    className="absolute left-0 right-0 -bottom-px h-[2px] bg-cyan-400"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1">
        {activeTab === "invites" && (
          <InvitesSection onOpenModal={() => setShowInviteModal(true)} />
        )}

        {activeTab === "security" && <SecuritySection />}

        {activeTab !== "invites" && activeTab !== "security" && (
          <div className="text-sm text-slate-500">
            Esta sección la completaremos más adelante. Ahora mismo la lógica
            principal está en invitaciones y seguridad (MFA).
          </div>
        )}
      </div>

      {/* Modal de invitar miembros */}
      {showInviteModal && (
        <InviteMemberModal onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );
};

/* -------------------- INVITES -------------------- */

const InvitesSection: React.FC<{ onOpenModal: () => void }> = ({
  onOpenModal,
}) => {
  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-cyan-400" />
        <h2 className="text-sm font-medium text-slate-100">
          Invitar miembros
        </h2>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        Envía invitaciones por correo para que otros usuarios se unan a tu
        cuenta como miembros de Zntinel.
      </p>
      <button
        onClick={onOpenModal}
        className="inline-flex items-center px-3 py-2 rounded-lg bg-cyan-500 text-sm font-medium text-slate-950 hover:bg-cyan-400 transition"
      >
        <Users className="w-4 h-4 mr-2" />
        Invitar miembro
      </button>
    </div>
  );
};

type InviteModalProps = {
  onClose: () => void;
};

const InviteMemberModal: React.FC<InviteModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin" | "owner">("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.includes("@")) {
      setError("Introduce un email válido.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/members/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Error al enviar la invitación.");
      } else {
        setSuccess("Invitación enviada correctamente.");
        setEmail("");
      }
    } catch (err) {
      setError("Error de red al enviar la invitación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-medium text-slate-100">
              Invitar nuevo miembro
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-sm"
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="persona@empresa.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Rol
            </label>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "member" | "admin" | "owner")
              }
              className="w-full rounded-lg bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/60 rounded-md px-2 py-1">
              {error}
            </p>
          )}

          {success && (
            <p className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/60 rounded-md px-2 py-1">
              {success}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800/80"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-2 text-xs rounded-lg bg-cyan-500 text-slate-950 font-medium hover:bg-cyan-400 disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar invitación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -------------------- SECURITY / MFA -------------------- */

const SecuritySection: React.FC = () => {
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleStartSetup = async () => {
    setLoadingSetup(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/mfa/setup`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Error al iniciar la configuración MFA.");
        return;
      }

      setSecret(data.secret || null);
      setOtpauthUrl(data.otpauthUrl || null);
      setMfaEnabled(!!data.mfaEnabled);

      if (data.mfaEnabled) {
        setSuccess(
          "La verificación en dos pasos ya está activada para esta cuenta."
        );
      } else {
        setSuccess(
          "Escanea el QR o introduce el código en tu app Authenticator y luego confirma con un código de 6 dígitos."
        );
      }
    } catch (err) {
      setError("Error de red al iniciar configuración MFA.");
    } finally {
      setLoadingSetup(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingConfirm(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/mfa/confirm`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Código inválido o error al activar MFA.");
        return;
      }

      setMfaEnabled(true);
      setSuccess("MFA activada correctamente para tu cuenta.");
      setCode("");
    } catch (err) {
      setError("Error de red al confirmar el código.");
    } finally {
      setLoadingConfirm(false);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4 text-cyan-400" />
        <h2 className="text-sm font-medium text-slate-100">
          Verificación en dos pasos (MFA)
        </h2>
      </div>
      <p className="text-sm text-slate-400">
        Protege tu acceso al panel añadiendo un segundo factor de autenticación
        mediante aplicaciones como Google Authenticator, 1Password, Authy, etc.
      </p>

      <div className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border border-slate-700 bg-slate-900/60">
        <span
          className={`w-2 h-2 rounded-full ${
            mfaEnabled ? "bg-emerald-400" : "bg-slate-500"
          }`}
        />
        <span className="text-slate-300">
          Estado:{" "}
          <span className="font-medium">
            {mfaEnabled === null
              ? "Sin comprobar"
              : mfaEnabled
              ? "Activada"
              : "No activada"}
          </span>
        </span>
      </div>

      <button
        onClick={handleStartSetup}
        disabled={loadingSetup}
        className="px-3 py-2 text-sm rounded-lg bg-cyan-500 text-slate-950 font-medium hover:bg-cyan-400 disabled:opacity-60 inline-flex items-center gap-2"
      >
        {loadingSetup ? "Cargando..." : "Configurar app Authenticator"}
      </button>

      {(secret || otpauthUrl) && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {otpauthUrl && (
              <div className="flex items-center justify-center">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <QRCodeSVG value={otpauthUrl} size={140} />
                </div>
              </div>
            )}
            <div className="flex-1 space-y-2">
              <p className="text-xs text-slate-300">
                1. Escanea el código QR con tu app Authenticator.
              </p>
              {secret && (
                <div className="text-xs">
                  <p className="text-slate-400 mb-1">
                    2. O introduce este código manualmente:
                  </p>
                  <code className="inline-block px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] tracking-[0.14em] uppercase text-cyan-300">
                    {secret}
                  </code>
                </div>
              )}
              <p className="text-xs text-slate-400">
                3. Introduce un código de 6 dígitos generado por la app para
                confirmar la activación.
              </p>
            </div>
          </div>

          <form onSubmit={handleConfirmCode} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-lg bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 tracking-[0.5em] text-center"
                placeholder="••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/60 rounded-md px-2 py-1">
                {error}
              </p>
            )}

            {success && (
              <p className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/60 rounded-md px-2 py-1">
                {success}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loadingConfirm || !code}
                className="px-3 py-2 text-xs rounded-lg bg-cyan-500 text-slate-950 font-medium hover:bg-cyan-400 disabled:opacity-60"
              >
                {loadingConfirm ? "Verificando..." : "Confirmar código"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
