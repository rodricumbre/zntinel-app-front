// src/components/layout/PageCard.tsx
import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const PageCard: React.FC<Props> = ({ title, subtitle, children }) => {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 shadow-[0_18px_60px_rgba(0,0,0,0.55)] p-5">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-slate-50">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
};

export default PageCard;
