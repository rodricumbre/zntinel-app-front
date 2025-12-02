// src/components/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";
import LanguageSwitch from "@/components/LanguageSwitch"; // pequeño toggle ES/EN

const Login: React.FC = () => {
  const [email, setEmail] = useState("");        // <- vacío
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(["auth", "common"]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();

    if (!sanitizedEmail || !sanitizedPassword) {
      setError(t("auth:errorRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setLoading(true);
      await login(sanitizedEmail, sanitizedPassword);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(t("auth:errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* halo de fondo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-cyan-500/15 via-sky-500/5 to-fuchsia-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/80 shadow-[0_18px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl px-8 py-9">
          {/* Barra superior: marca + selector idioma */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.32em] text-slate-400">
                {t("common:brand")}
              </div>
            </div>
            <LanguageSwitch />
          </div>

          {/* Títulos */}
          <div className="mb-6">
            <h1 className="mt-1 text-2xl font-semibold text-slate-50">
              {t("auth:title")}
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              {t("auth:subtitle_part1")}{" "}
              <span className="text-cyan-300">
                {t("auth:subtitle_highlight")}
              </span>
              {t("auth:subtitle_part2")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                {t("auth:emailLabel")}
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/60"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder={t("auth:emailPlaceholder")}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                {t("auth:passwordLabel")}
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/60"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder={t("auth:passwordPlaceholder")}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t("auth:submitLoading") : t("auth:submit")}
            </button>
          </form>

          {/* mini texto de confianza */}
          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500">
            <span>{t("common:footerVersion")}</span>
            <span className="text-slate-500">{t("common:footerLinks")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
