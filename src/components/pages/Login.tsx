// src/components/pages/Login.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/lib/language";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.zntinel.com";

type Lang = "es" | "en";

const copy = {
  es: {
    title: "Inicia sesión",
    subtitle:
      "Controla tu WAF gestionado, bloquea bots y revisa métricas de seguridad en tiempo real.",
    emailLabel: "Email",
    passwordLabel: "Password",
    emailPlaceholder: "tucorreo@empresa.com",
    passwordPlaceholder: "••••••••",
    button: "Entrar",
    buttonLoading: "Entrando...",
    errorEmpty: "Introduce email y contraseña.",
    errorGeneric: "Credenciales inválidas o error de servidor",
    mfaTitle: "Verificación en dos pasos",
    mfaSubtitle:
      "Introduce el código de 6 dígitos de tu app Authenticator.",
    mfaLabel: "Código de 6 dígitos",
    mfaPlaceholder: "123 456",
    mfaButton: "Verificar",
    mfaButtonLoading: "Verificando...",
    mfaErrorGeneric: "Código inválido o error de verificación",
    footerLeft: "Control Center · v1.0",
    footerRight: "TLS · WAF · Bots · Logs",
  },
  en: {
    title: "Log in",
    subtitle:
      "Control your managed WAF, block bots and review security metrics in real time.",
    emailLabel: "Email",
    passwordLabel: "Password",
    emailPlaceholder: "you@company.com",
    passwordPlaceholder: "••••••••",
    button: "Log in",
    buttonLoading: "Logging in...",
    errorEmpty: "Enter email and password.",
    errorGeneric: "Invalid credentials or server error",
    mfaTitle: "Two-factor authentication",
    mfaSubtitle: "Enter the 6-digit code from your Authenticator app.",
    mfaLabel: "6-digit code",
    mfaPlaceholder: "123 456",
    mfaButton: "Verify",
    mfaButtonLoading: "Verifying...",
    mfaErrorGeneric: "Invalid code or verification error",
    footerLeft: "Control Center · v1.0",
    footerRight: "TLS · WAF · Bots · Logs",
  },
} as const;

const Login: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const t = copy[lang];

  const [step, setStep] = useState<"password" | "mfa">("password");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [mfaCode, setMfaCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [mfaError, setMfaError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const inviteToken = params.get("inviteToken") || null;

  // Si viene de invitación, pre-rellenamos el email
  useEffect(() => {
    const inviteEmail = params.get("email");
    if (inviteEmail) {
      setEmail(inviteEmail);
    }
  }, [location.search]);

  async function finishLogin() {
    // Si viene de invitación, intentamos asociar la cuenta
    if (inviteToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/accept-invite-existing`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: inviteToken }),
        });
      } catch (e) {
        console.error("Error aceptando invitación existente", e);
      }
    }

    // Para evitar líos con contextos, forzamos navegación dura
    window.location.href = "/dashboard";
    // Si prefieres SPA:
    // navigate("/dashboard");
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();

    if (!sanitizedEmail || !sanitizedPassword) {
      setError(t.errorEmpty);
      return;
    }

    setLoading(true);
    setError(null);
    setMfaError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: sanitizedEmail,
          password: sanitizedPassword,
        }),
      });

      const data = await res.json().catch(() => ({} as any));
      console.log("[LOGIN FRONT] status", res.status, "data", data);

      if (!res.ok || !data.success) {
        setError(
          data?.error ? `${t.errorGeneric} (${data.error})` : t.errorGeneric
        );
        return;
      }

      // Si el usuario tiene MFA activado → mostramos el paso OTP
      if (data.mfaRequired && data.challengeId) {
        setChallengeId(data.challengeId as string);
        setStep("mfa");
        setMfaCode("");
        setMfaError(null);
        return;
      }

      // Si no hay MFA → login directo
      await finishLogin();
    } catch (err) {
      console.error("[LOGIN FRONT] exception", err);
      setError(t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!challengeId) {
      setMfaError(t.mfaErrorGeneric);
      return;
    }

    const code = mfaCode.trim();
    if (!code) {
      setMfaError(t.mfaErrorGeneric);
      return;
    }

    setMfaLoading(true);
    setMfaError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/mfa/verify-login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challengeId,
          code,
        }),
      });

      const data = await res.json().catch(() => ({} as any));
      console.log("[MFA FRONT] status", res.status, "data", data);

      if (!res.ok || !data.success || !data.mfaVerified) {
        setMfaError(
          data?.error
            ? `${t.mfaErrorGeneric} (${data.error})`
            : t.mfaErrorGeneric
        );
        return;
      }

      await finishLogin();
    } catch (err) {
      console.error("[MFA FRONT] exception", err);
      setMfaError(t.mfaErrorGeneric);
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* halo de fondo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-cyan-500/15 via-sky-500/5 to-fuchsia-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/80 shadow-[0_18px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl px-8 py-9 relative">
          {/* Switch de idioma */}
          <div className="absolute right-6 top-6 flex items-center gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setLang("es")}
              className={`px-2 py-0.5 rounded-full border text-[11px] transition ${
                lang === "es"
                  ? "bg-[#ff1133] text-white border-[#ff1133] shadow-[0_0_15px_rgba(255,17,51,0.45)]"
                  : "bg-transparent text-slate-400 border-slate-600 hover:border-cyan-400/70 hover:text-cyan-300"
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2 py-0.5 rounded-full border text-[11px] transition ${
                lang === "en"
                  ? "bg-[#ff1133] text-white border-[#ff1133] shadow-[0_0_15px_rgba(255,17,51,0.45)]"
                  : "bg-transparent text-slate-400 border-slate-600 hover:border-cyan-400/70 hover:text-cyan-300"
              }`}
            >
              EN
            </button>
          </div>

          {/* Marca */}
          <div className="mb-6">
            <div className="text-[11px] font-semibold tracking-[0.32em] text-slate-400">
              ZNTINEL
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-slate-50">
              {step === "password" ? t.title : t.mfaTitle}
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              {step === "password" ? t.subtitle : t.mfaSubtitle}
            </p>
          </div>

          {step === "password" ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/60"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder={t.emailPlaceholder}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">
                  {t.passwordLabel}
                </label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/60"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder={t.passwordPlaceholder}
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
                {loading ? t.buttonLoading : t.button}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">
                  {t.mfaLabel}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/60 tracking-[0.3em] text-center"
                  value={mfaCode}
                  onChange={(e) =>
                    setMfaCode(
                      e.target.value
                        .replace(/\s+/g, "")
                        .replace(/[^0-9]/g, "")
                    )
                  }
                  placeholder={t.mfaPlaceholder}
                />
              </div>

              {mfaError && (
                <div className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                  {mfaError}
                </div>
              )}

              <button
                type="button"
                onClick={() => setDisableConfirmOpen(true)}
                disabled={mfaLoading}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-200 hover:border-rose-500/70 hover:text-rose-200 hover:bg-slate-900/90 transition disabled:opacity-60"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {mfaLoading ? "Desactivando..." : "Desactivar MFA"}
              </button>
            </form>
          )}

          {/* mini texto de confianza */}
          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500">
            <span>{t.footerLeft}</span>
            <span className="text-slate-500">{t.footerRight}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
