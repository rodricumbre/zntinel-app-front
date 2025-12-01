// src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "/src/lib/auth";

const API_URL = import.meta.env.VITE_API_URL;

const Login: React.FC = () => {
  const [email, setEmail] = useState("admin@zntinel.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const sanitizedEmail = email.trim().toLowerCase();
  const sanitizedPassword = password.trim();

  if (!sanitizedEmail || !sanitizedPassword) {
    setError("Introduce email y contraseña.");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    // Usa el login del contexto, que ya llama a /auth/login y /auth/me
    await login(sanitizedEmail, sanitizedPassword);

    // Si no lanza error, ya tienes user + account en el contexto
    navigate("/dashboard");
  } catch (err) {
    console.error("ERROR EN LOGIN FRONT:", err);
    setError("Credenciales inválidas o error de servidor");
  } finally {
    setLoading(false);
  }
};




  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="text-z-cyan font-semibold tracking-[0.25em] text-xs uppercase mb-2">
          ZNTINEL
        </div>
        <h1 className="text-2xl font-semibold text-slate-100 mb-1">
          Inicia sesión
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Accede al panel de protección WAF, bots y métricas en tiempo real.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-z-cyan focus:border-z-cyan"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-z-cyan focus:border-z-cyan"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-z-cyan text-slate-950 rounded-xl py-2 text-sm font-semibold hover:bg-cyan-300 transition disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
