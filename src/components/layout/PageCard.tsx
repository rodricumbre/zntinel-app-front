import React from "react";

type PageCardProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

const PageCard: React.FC<PageCardProps> = ({ title, subtitle, children }) => {
  return (
    <div className="relative w-full">
      {/* Línea de escaneo muy sutil en cian */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-scanLine opacity-20 bg-cyan-400 h-px w-full absolute top-0" />
      </div>

      {/* Card principal */}
      <div className="relative rounded-2xl border border-slate-800/80 bg-[#070b15]/95 backdrop-blur-xl p-6 shadow-[0_0_40px_rgba(15,23,42,0.8)] overflow-hidden">
        {/* Halo suave azul/morado detrás del contenido */}
        <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-gradient-to-tr from-cyan-500/10 via-sky-500/5 to-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500/12 via-purple-500/8 to-cyan-400/5 blur-3xl" />

        {/* Borde interno sutil */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-slate-500/5" />

        <div className="relative">
          {title && (
            <h1 className="text-lg font-semibold text-slate-50 tracking-tight mb-1">
              {title}
            </h1>
          )}

          {subtitle && (
            <p className="text-sm text-slate-400 mb-4">
              {subtitle}
            </p>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};

export default PageCard;
