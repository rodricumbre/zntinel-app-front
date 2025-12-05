// src/components/pages/Register.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/lib/language";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.zntinel.com";

type Lang = "es" | "en";

const copy = {
  es: {
    title: "Crea tu cuenta",
    subtitle:
      "Configura tu panel de Zntinel, conecta tu dominio y empieza a proteger tu web.",
    firstNameLabel: "Nombre",
    lastNameLabel: "Apellido",
    emailLabel: "Email",
    passwordLabel: "Password",
    firstNamePlaceholder: "Tu nombre",
    lastNamePlaceholder: "Tu apellido",
    emailPlaceholder: "tucorreo@empresa.com",
    passwordPlaceholder: "••••••••",
    button: "Crear cuenta",
    buttonLoading: "Creando cuenta...",
    errorEmpty: "Rellena todos los campos.",
    errorGeneric:
      "No se ha podido crear la cuenta. Revisa los datos o inténtalo más tarde.",
  },
  en: {
    title: "Create your account",
    subtitle:
      "Set up your Zntinel Control Center, connect your domain and start protecting your site.",
    firstNameLabel: "First name",
    lastNameLabel: "Last name",
    emailLabel: "Email",
    passwordLabel: "Password",
    firstNamePlaceholder: "Your first name",
    lastNamePlaceholder: "Your last name",
    emailPlaceholder: "you@company.com",
    passwordPlaceholder: "••••••••",
    button: "Create account",
    buttonLoading: "Creating account...",
    errorEmpty: "Fill in all fields.",
    errorGeneric:
      "Could not create account. Check your data or try again later.",
  },
} as const;

const Register: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { lang, setLang } = useLanguage();
  const t = copy[lang];

  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const inviteToken = params.get("inviteToken");

  useEffect(() => {
    const inviteEmail = params.get("email");
    if (inviteEmail) {
      setEmail(inviteEmail);
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const sanitizedFirstName = firstName.trim();
    const sanitizedLastName = lastName.trim();
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();

    if (
      !sanitizedFirstName ||
      !sanitizedLastName ||
      !sanitizedEmail ||
      !sanitizedPassword
    ) {
      setError(t.errorEmpty);
      return;
    }

    setLoading(true);

    try {
      if (inviteToken) {
        // Registro a través de invitación
        const res = await fetch(`${API_BASE_URL}/auth/accept-invite`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: inviteToken,
            password: sanitizedPassword,
            firstName: sanitizedFirstName,
            lastName: sanitizedLastName,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(
            data.error ||
              "No se ha podido aceptar la invitación. Inténtalo de nuevo."
          );
          setLoading(false);
          return;
        }

        navigate("/dashboard");
      } else {
        // Registro normal (sin invitación)
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: sanitizedEmail,
            password: sanitizedPassword,
            firstName: sanitizedFirstName,
            lastName: sanitizedLastName,
            // companyName opcional: el backend ya tiene "My Company" por defecto
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(
            data.error ||
              "No se ha podido crear la cuenta. Inténtalo de nuevo."
          );
          setLoading(false);
          return;
        }

        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError(t.errorGeneric);
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
              {t.title}
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              {t.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                {t.firstNameLabel}
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/60"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t.firstNamePlaceholder}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-400">
                {t.lastNameLabel}
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/60"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t.lastNamePlaceholder}
              />
            </div>

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
                autoComplete="new-password"
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

          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500">
            <span>Control Center · v1.0</span>
            <span className="text-slate-500">TLS · WAF · Bots · Logs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
