// src/components/layout/LogoutOverlay.tsx
import React from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

const LogoutOverlay: React.FC = () => {
  const { isLoggingOut } = useAuth();

  if (!isLoggingOut) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/95 px-6 py-4 shadow-2xl flex items-center gap-3">
        <div className="w-9 h-9 rounded-full border border-sky-500/60 bg-sky-500/10 flex items-center justify-center">
          <LogOut className="w-4 h-4 text-sky-300 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-50">
            Cerrando sesión…
          </span>
          <span className="text-[11px] text-slate-400">
            Saliendo del Control Center de Zntinel.
          </span>
        </div>
      </div>
    </div>
  );
};

export default LogoutOverlay;
