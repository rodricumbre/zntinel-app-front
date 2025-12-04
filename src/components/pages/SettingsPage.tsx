import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Users, Mail } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.zntinel.com";

const settingsTabs = [
  { id: "profile", label: "Perfil" },
  { id: "organization", label: "Organización" },
  { id: "members", label: "Miembros" },
  { id: "invites", label: "Invitar miembros" },
];

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState< string >("invites");
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
            Gestiona miembros, invitaciones y configuración del panel.
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
                    // Opcional: abrir directamente el modal
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

      {/* Contenido principal (de momento solo nos interesa Invites) */}
      <div className="flex-1">
        {activeTab === "invites" && (
          <InvitesSection onOpenModal={() => setShowInviteModal(true)} />
        )}
        {activeTab !== "invites" && (
          <div className="text-sm text-slate-500">
            Esta sección la rellenamos más adelante. Ahora mismo nos
            centramos en la invitación de miembros.
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
        credentials: "include", // importante para enviar cookie de sesión
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

export default SettingsPage;
