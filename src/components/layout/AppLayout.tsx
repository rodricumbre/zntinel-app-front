// src/components/layout/AppLayout.tsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* halo de fondo */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-fuchsia-500/5 blur-3xl" />
      </div>

      {/* SIDEBAR */}
      <aside className="relative z-20 w-60 border-r border-slate-900/80 bg-slate-950/90 backdrop-blur-xl flex flex-col">
        {/* Brand */}
        <div className="h-16 px-5 flex items-center border-b border-slate-900/80">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-sky-500 flex items-center justify-center shadow-[0_0_35px_rgba(56,189,248,0.45)]">
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

        {/* Nav */}
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
                      ? "bg-cyan-500/15 text-cyan-200 border border-cyan-500/50 shadow-[0_0_18px_rgba(56,189,248,0.25)]"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent"
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

        {/* User / Logout */}
        <div className="border-t border-slate-900/80 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-800/80 flex items-center justify-center text-[11px] font-semibold text-slate-100">
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
              className="inline-flex items-center justify-center rounded-lg border border-slate-800 px-2 py-1.5 text-[11px] text-slate-400 hover:border-red-500/70 hover:text-red-300 hover:bg-red-950/30 transition"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="relative z-10 flex-1 flex flex-col">
        {/* TOPBAR */}
        <header className="h-16 border-b border-slate-900/80 bg-slate-950/80 backdrop-blur-xl flex items-center px-6 justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-400">
              Zntinel · Managed WAF & Bot Defense
            </span>
            <span className="text-sm text-slate-100">
              Vista: {getPageTitle(location.pathname)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
              Status: All systems operational
            </span>
            <span className="rounded-full border border-slate-700 px-2 py-0.5 text-slate-400">
              Plan: {user?.plan ?? "—"}
            </span>
          </div>
        </header>

        {/* CONTENT WRAPPER */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
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
