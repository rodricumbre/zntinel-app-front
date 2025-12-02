// src/lib/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  es: {
    common: {
      brand: "ZNTINEL",
      footerVersion: "Control Center · v1.0",
      footerLinks: "TLS · WAF · Bots · Logs",
    },
    auth: {
      title: "Inicia sesión",
      subtitle_part1: "Controla tu ",
      subtitle_highlight: "WAF gestionado",
      subtitle_part2: ", bloquea bots y revisa métricas de seguridad en tiempo real.",
      emailLabel: "Email",
      emailPlaceholder: "tucorreo@empresa.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      submit: "Entrar",
      submitLoading: "Entrando…",
      errorRequired: "Introduce email y contraseña.",
      errorGeneric: "Credenciales inválidas o error de servidor",
    },
    dashboard: {
      welcome: "Bienvenido al panel de Zntinel",
      // añade aquí los textos que ya tengas en el dashboard
    },
  },
  en: {
    common: {
      brand: "ZNTINEL",
      footerVersion: "Control Center · v1.0",
      footerLinks: "TLS · WAF · Bots · Logs",
    },
    auth: {
      title: "Sign in",
      subtitle_part1: "Control your ",
      subtitle_highlight: "managed WAF",
      subtitle_part2: ", block bots and review real-time security metrics.",
      emailLabel: "Email",
      emailPlaceholder: "you@company.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      submit: "Sign in",
      submitLoading: "Signing in…",
      errorRequired: "Please enter email and password.",
      errorGeneric: "Invalid credentials or server error",
    },
    dashboard: {
      welcome: "Welcome to Zntinel Control Center",
      // mismos keys que en ES
    },
  },
};

const getInitialLang = () => {
  if (typeof window === "undefined") return "es";
  const stored = window.localStorage.getItem("zntinel_lang");
  if (stored === "es" || stored === "en") return stored;

  const nav = window.navigator.language || "es";
  return nav.startsWith("en") ? "en" : "es";
};

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLang(),
  fallbackLng: "es",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
