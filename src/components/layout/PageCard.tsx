import React from "react";

type PageCardProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

const PageCard: React.FC<PageCardProps> = ({ title, subtitle, children }) => {
  return (
    <div className="relative w-full">
      {/* Línea de escaneo horizontal roja */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-scanLine opacity-20 bg-red-500 h-px w-full absolute top-0" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#15151c]/90 backdrop-blur-xl p-6 shadow-[0_0_35px_rgba(248,113,113,0.15)]">
        {title && (
          <h1 className="text-lg font-semibold text-white tracking-tight mb-1">
            {title}
          </h1>
        )}

        {subtitle && (
          <p className="text-sm text-[#9a9aa3] mb-4">{subtitle}</p>
        )}

        {children}
      </div>
    </div>
  );
};

export default PageCard;
