// src/components/layout/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";

const base =
  "block px-4 py-2 text-sm rounded-lg text-slate-300 hover:bg-slate-800 hover:text-slate-50 transition";
const active =
  "bg-slate-900 text-slate-50 border border-slate-700";

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
      <div className="h-16 flex items-center px-4 border-b border-slate-800">
        <span className="text-z-cyan text-xs tracking-[0.25em] font-semibold uppercase">
          ZNTINEL
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `${base} ${isActive ? active : ""}`}
        >
          Overview
        </NavLink>
        <NavLink
          to="/clients"
          className={({ isActive }) => `${base} ${isActive ? active : ""}`}
        >
          Clients
        </NavLink>
        <NavLink
          to="/account-usage"
          className={({ isActive }) => `${base} ${isActive ? active : ""}`}
        >
          Account Usage
        </NavLink>
        <NavLink
          to="/members"
          className={({ isActive }) => `${base} ${isActive ? active : ""}`}
        >
          Members
        </NavLink>
        <NavLink
          to="/metrics"
          className={({ isActive }) => `${base} ${isActive ? active : ""}`}
        >
          Metrics
        </NavLink>
        <NavLink
          to="/logs"
          className={({ isActive }) => `${base} ${isActive ? active : ""}`}
        >
          Logs
        </NavLink>
      </nav>

      <div className="px-4 py-3 border-t border-slate-800 text-[11px] text-slate-500">
        © 2025 Zntinel
      </div>
    </aside>
  );
};

export default Sidebar;
