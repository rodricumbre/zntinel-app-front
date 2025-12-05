// src/components/layout/Topbar.tsx
import React from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/lib/language";


const Topbar: React.FC = () => {
  const { user, account, logout } = useAuth();
  const navigate = useNavigate();
  const {lang, toggleLang } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between px-8">
      <div>
        <h1 className="text-sm font-semibold text-slate-100">
          Panel de seguridad Zntinel
        </h1>
        <p className="text-xs text-slate-400">
          {account
            ? `${account.name} · Plan ${account.plan.toUpperCase()}`
            : "Sin cuenta cargada"}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-xs font-medium text-slate-100">
            {user
              ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
                user.email
              : "Zntinel Admin"}
          </div>
          <div className="text-[11px] text-slate-400">
            {user?.email ?? "admin@zntinel.com"}
          </div>
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
