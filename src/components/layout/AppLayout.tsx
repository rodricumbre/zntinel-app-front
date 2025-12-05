// src/components/layout/AppLayout.tsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getPlanLabel, getPlanDetail } from "@/utils/plan";

import {
  Shield,
  BarChart2,
  Globe2,
  Users,
  Activity,
  Logs as LogsIcon,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

type AppLayoutProps = {
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: Shield },
  { label: "Dominios", path: "/clients", icon: Globe2 },
  { label: "Uso de cuenta", path: "/account-usage", icon: BarChart2 },
  { label: "Miembros", path: "/members", icon: Users },
  { label: "Métricas", path: "/metrics", icon: Activity },
  { label: "Logs", path: "/logs", icon: LogsIcon },
  { label: "Ajustes", path: "/settings", icon: Settings },
];

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, account, logout } = useAuth();
  const planLabel = account ? getPlanLabel(account.plan) : "Sin plan";


  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    // Layout fijado a viewport; solo scrollea el main
    <div className="h-screen overflow-hidden bg-[#030712] text-[#e2e8f0] flex">
      {/* Halos de fondo en azul/cian/morado */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-cyan-500/14 blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-80 w-80 rounded-full bg-indigo-500/18 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      {/* SIDEBAR fijo en altura */}
      <aside className="relative z-20 w-60 h-full flex-shrink-0 border-r border-slate-900/90 bg-[#050816]/95 backdrop-blur-xl flex flex-col">
        {/* Brand */}
        <div className="h-16 px-5 flex items-center border-b border-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-indigo-400 flex items-center justify-center shadow-[0_0_32px_rgba(56,189,248,0.55)]">
              <Shield className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-[0.28em] text-slate-400">
                ZNTINEL
              </div>
              <div className="text-[11px] text-slate-500">
                Control Center · v1.0
              </div>
            </div>
          </div>
        </div>

        {/* Navegación (si algún día crece mucho, solo scrollea esta parte) */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition 
                  ${
                    active
                      ? "bg-gradient-to-r from-sky-500/20 via-cyan-400/15 to-indigo-500/20 text-sky-50 border border-cyan-400/60 shadow-[0_0_24px_rgba(56,189,248,0.45)]"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/70 border border-transparent"
                  }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform duration-150 ${
                    active ? "scale-110" : "group-hover:scale-105"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / Logout siempre visible abajo */}
        <div className="border-t border-slate-900/90 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-800/90 flex items-center justify-center text-[11px] font-semibold text-slate-100">
                {user?.first_name?.[0]?.toUpperCase() ??
                  user?.email?.[0]?.toUpperCase() ??
                  "Z"}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-100">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.email ?? "Owner"}
                </span>
                <span className="text-[10px] text-slate-500">
                  Cuenta segura · TLS · WAF
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-lg border border-slate-800 px-2 py-1.5 text-[11px] text-slate-400 hover:border-sky-500/70 hover:text-sky-200 hover:bg-slate-900/70 transition"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="relative z-10 flex-1 flex flex-col h-full">
        {/* TOPBAR */}
        <header className="h-16 border-b border-slate-900/80 bg-[#050818]/90 backdrop-blur-xl flex items-center px-6 justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-400">
              Zntinel · Enterprise Cloud Protection
            </span>
            <span className="text-sm text-slate-100">
              Vista: {getPageTitle(location.pathname)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5 rounded-full border border-sky-400/60 bg-sky-500/10 px-2.5 py-0.5 text-sky-100">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse" />
              <span>Monitorización continua</span>
            </div>
            <span className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
              Estado: Todos los sistemas operativos
            </span>
            <span className="rounded-full border border-slate-700 px-2 py-0.5 text-slate-400">
              Plan:{" "}
              <span className="font-semibold">
              {planLabel}
              </span>
            </span>
          </div>
        </header>

        {/* Barra de gradiente */}
        <div className="h-1 w-full bg-gradient-to-r from-sky-500/40 via-cyan-400/60 to-indigo-500/40 opacity-70" />

        {/* CONTENT WRAPPER con scroll propio */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
};

function getPageTitle(pathname: string): string {
  const found = navItems.find((n) => n.path === pathname);
  if (found) return found.label;
  if (pathname === "/") return "Dashboard";
  return "Panel";
}

export default AppLayout;
