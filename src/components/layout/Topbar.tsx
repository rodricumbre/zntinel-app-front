// src/components/layout/Topbar.tsx
import React from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/language";
import { getPlanLabel, getPlanDetail } from "@/utils/plan";


type PlanId = "free" | "business" | "premium" | string | undefined;

function getPlanDetail(plan: PlanId) {
  switch (plan) {
    case "free":
      return "1 dominio · 1 usuario";
    case "business":
      return "hasta 2 dominios · 5 usuarios";
    case "premium":
      return "dominios y seats ampliables";
    default:
      return "Plan no asignado";
  }
}

const Topbar: React.FC = () => {
  const { user, account, logout } = useAuth();
  const navigate = useNavigate();
  const { lang, toggleLang } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const planId: PlanId = account?.plan;
  const planLabel = getPlanLabel(planId);
  const planDetail = getPlanDetail(planId);

  const displayName =
    (user
      ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
      : "") || user?.email || "Zntinel Admin";

  const displayEmail = user?.email ?? "admin@zntinel.com";

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between px-8">
      {/* LADO IZQUIERDO: nombre de cuenta + plan */}
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-semibold text-slate-100">
          Panel de seguridad Zntinel
        </h1>

        {account ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-slate-400">{account.name}</p>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-[11px] text-slate-200">
              <span className="text-slate-400">Plan:</span>
              <span className="font-medium">{planLabel}</span>
              <span className="hidden sm:inline text-slate-500">
                · {planDetail}
              </span>
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Sin cuenta cargada</p>
        )}
      </div>

      {/* LADO DERECHO: usuario + idioma + logout */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end gap-1">
          <div className="text-xs font-medium text-slate-100">
            {displayName}
          </div>
          <div className="text-[11px] text-slate-400">{displayEmail}</div>

          <button
            type="button"
            onClick={toggleLang}
            className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-200 hover:border-cyan-400 hover:text-cyan-300 transition"
          >
            <span className="uppercase">
              {lang === "es" ? "ES" : "EN"}
            </span>
            <span className="h-3 w-px bg-slate-600" />
            <span className="uppercase">
              {lang === "es" ? "EN" : "ES"}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="text-xs px-3 py-1.5 rounded-full border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
