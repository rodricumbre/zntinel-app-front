// src/components/LanguageSwitch.tsx
import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSwitch: React.FC = () => {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith("en") ? "en" : "es";

  const changeLanguage = (lng: "es" | "en") => {
    i18n.changeLanguage(lng);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("zntinel_lang", lng);
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <button
        type="button"
        onClick={() => changeLanguage("es")}
        className={`px-2 py-1 rounded-lg border text-[11px] uppercase tracking-[0.18em]
          ${
            current === "es"
              ? "bg-z-cyan text-slate-950 border-z-cyan"
              : "bg-slate-900 border-slate-700 hover:border-z-cyan/60"
          }`}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => changeLanguage("en")}
        className={`px-2 py-1 rounded-lg border text-[11px] uppercase tracking-[0.18em]
          ${
            current === "en"
              ? "bg-z-cyan text-slate-950 border-z-cyan"
              : "bg-slate-900 border-slate-700 hover:border-z-cyan/60"
          }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitch;
