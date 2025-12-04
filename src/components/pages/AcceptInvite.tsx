// src/components/pages/AcceptInvite.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.zntinel.com";

const AcceptInvite: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<
    "loading" | "redirecting" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setError("Invitación inválida: falta el token.");
      return;
    }

    const run = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/auth/invite-info?token=${encodeURIComponent(
            token
          )}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
          setStatus("error");
          setError(data.error || "No se ha podido validar la invitación.");
          return;
        }

        const email = data.email as string;
        const alreadyRegistered = !!data.alreadyRegistered;

        setStatus("redirecting");

        if (alreadyRegistered) {
          navigate(
            `/login?inviteToken=${encodeURIComponent(
              token
            )}&email=${encodeURIComponent(email)}`
          );
        } else {
          navigate(
            `/register?inviteToken=${encodeURIComponent(
              token
            )}&email=${encodeURIComponent(email)}`
          );
        }
      } catch (e) {
        console.error(e);
        setStatus("error");
        setError("Error de red al validar la invitación.");
      }
    };

    run();
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/80 shadow-[0_18px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl px-8 py-9">
        <div className="text-[11px] font-semibold tracking-[0.32em] text-slate-400">
          ZNTINEL
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-slate-50">
          Procesando invitación…
        </h1>
        {status === "loading" || status === "redirecting" ? (
          <p className="mt-3 text-xs text-slate-400">
            Validando tu invitación y redirigiéndote al paso correcto.
          </p>
        ) : (
          <p className="mt-3 text-xs text-red-300">
            {error || "Ha ocurrido un error al procesar la invitación."}
          </p>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
