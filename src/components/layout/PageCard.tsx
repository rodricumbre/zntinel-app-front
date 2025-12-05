import React from "react";

export default function PageCard({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full">

      {/* Líneas animadas de fondo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-scanLine opacity-10 bg-red-500 h-px w-full absolute top-0" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#15151c]/90 backdrop-blur-xl p-6 shadow-[0_0_35px_rgba(255,20,60,0.08)]">

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
}
