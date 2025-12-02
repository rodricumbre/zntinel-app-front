// src/components/pages/Dashboard.tsx
import React from "react";
import { useLanguage } from "@/lib/language";
import { DomainOnboardingModal } from "@/components/domains/DomainOnboardingModal";


import { useEffect, useState } from "react";

type Lang = "es" | "en";


type Domain = {
  id: string;
  hostname: string;
  dns_status: "pending" | "ok";
  verification_token: string;
};

const copy: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    kpis: {
      trafficTitle: string;
      trafficSub: string;
      attacksTitle: string;
      attacksSub: string;
      uptimeTitle: string;
      uptimeSub: string;
      latencyTitle: string;
      latencySub: string;
    };
    sections: {
      protectionTitle: string;
      protectionDesc: string;
      protectionItems: string[];
      anomaliesTitle: string;
      anomaliesDesc: string;
      anomaliesEmpty: string;
      topClientsTitle: string;
      topClientsDesc: string;
      activityTitle: string;
      activityDesc: string;
    };
    table: {
      client: string;
      attacks: string;
      status: string;
      risk: string;
    };
    activityLabels: {
      time: string;
      event: string;
      source: string;
    };
  }
> = {
  es: {
    title: "Overview",
    subtitle:
      "Resumen de tráfico, ataques bloqueados y estado general de tu cuenta.",
    kpis: {
      trafficTitle: "Requests 24h",
      trafficSub: "+12.3% vs ayer",
      attacksTitle: "Ataques bloqueados",
      attacksSub: "Basado en tus custom rules",
      uptimeTitle: "Uptime",
      uptimeSub: "Todas las propiedades operativas",
      latencyTitle: "Latencia media",
      latencySub: "Hoja de ruta para seguir optimizando",
    },
    sections: {
      protectionTitle: "Salud de la protección",
      protectionDesc:
        "Indicadores agregados de WAF, bots y disponibilidad por entorno.",
      protectionItems: [
        "Reglas WAF críticas actualizadas en las últimas 48h",
        "Firmas de bots entrenadas con el último patrón de tráfico",
        "Todas las zonas corriendo con TLS estricto y HTTP/2",
      ],
      anomaliesTitle: "Anomalías en tiempo real",
      anomaliesDesc:
        "Detecciones recientes que se salen del comportamiento normal.",
      anomaliesEmpty: "Sin anomalías críticas en las últimas 2 horas.",
      topClientsTitle: "Top clientes protegidos",
      topClientsDesc:
        "Sitios con más tráfico bajo Zntinel en las últimas 24 horas.",
      activityTitle: "Actividad de seguridad",
      activityDesc:
        "Acciones automáticas ejecutadas por Zntinel sin intervención manual.",
    },
    table: {
      client: "Cliente",
      attacks: "Ataques bloqueados",
      status: "Estado",
      risk: "Riesgo",
    },
    activityLabels: {
      time: "Hora",
      event: "Evento",
      source: "Origen",
    },
  },
  en: {
    title: "Overview",
    subtitle:
      "Summary of traffic, blocked attacks and overall health of your account.",
    kpis: {
      trafficTitle: "Requests 24h",
      trafficSub: "+12.3% vs yesterday",
      attacksTitle: "Blocked attacks",
      attacksSub: "Based on your custom rules",
      uptimeTitle: "Uptime",
      uptimeSub: "All properties operational",
      latencyTitle: "Avg latency",
      latencySub: "Roadmap to keep improving performance",
    },
    sections: {
      protectionTitle: "Protection health",
      protectionDesc:
        "Aggregated indicators for WAF, bots and availability per environment.",
      protectionItems: [
        "Critical WAF rules updated in the last 48h",
        "Bot models trained on the latest traffic pattern",
        "All zones running with strict TLS and HTTP/2",
      ],
      anomaliesTitle: "Real-time anomalies",
      anomaliesDesc: "Recent detections that deviate from normal behavior.",
      anomaliesEmpty: "No critical anomalies in the last 2 hours.",
      topClientsTitle: "Top protected clients",
      topClientsDesc:
        "Sites with the highest traffic under Zntinel in the last 24 hours.",
      activityTitle: "Security activity",
      activityDesc:
        "Automatic actions executed by Zntinel with no manual intervention.",
    },
    table: {
      client: "Client",
      attacks: "Blocked attacks",
      status: "Status",
      risk: "Risk",
    },
    activityLabels: {
      time: "Time",
      event: "Event",
      source: "Source",
    },
  },
};

const fakeClients = [
  { name: "Velca", attacks: "12.4k", status: "Protected", risk: "Low" },
  { name: "Boutique Gym 24", attacks: "4.1k", status: "Protected", risk: "Medium" },
  { name: "SaaS Invoice Cloud", attacks: "21.9k", status: "Hardening", risk: "High" },
];

const fakeActivity = [
  {
    time: "09:12",
    event: "Rule set · SQLi + LFI tuned for /api/v1/*",
    source: "Autotuning · WAF",
  },
  {
    time: "08:47",
    event: "Bot challenge escalated for /login endpoints",
    source: "Behavioral Bots",
  },
  {
    time: "08:05",
    event: "Origin pool failover · 0s downtime",
    source: "Availability Engine",
  },
];

export function DashboardDomainsWidget() {
  const [domains, setDomains] = useState<Domain[] | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE =
    import.meta.env.VITE_API_URL ?? "https://api.zntinel.com";

  // Carga inicial de dominios
  useEffect(() => {
    fetch(`${API_BASE}/domains`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const list = data.domains || [];
          setDomains(list);
          if (list.length === 0) {
            // no hay dominios => abrimos modal
            setShowModal(true);
          }
        } else {
          console.error("Error loading domains", data);
          // si falla, también puedes abrir modal si quieres
          setShowModal(true);
        }
      })
      .catch((err) => {
        console.error("Error loading domains", err);
        setShowModal(true);
      });
  }, []);

  const handleSubmitDomain = async (hostname: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/domains`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("Error creando dominio", data);
        alert("Error creando dominio: " + (data.error || "desconocido"));
        return;
      }

      setDomains([data.domain]);
      setShowModal(false);
    } catch (e) {
      console.error(e);
      alert("Error de red creando dominio");
    } finally {
      setLoading(false);
    }
  };

  // Mientras carga, no mostramos nada (o un skeleton si quieres)
  if (domains === null) {
    return null;
  }

  const domain = domains[0]; // de momento 1 por cuenta

  return (
    <>
      {/* Banner de estado de dominio */}
      {domains.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-200">
          Todavía no has configurado ningún dominio.
        </div>
      ) : domain.dns_status === "pending" ? (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/5 p-4 text-sm">
          <div className="font-medium mb-1">
            Verificación de dominio pendiente
          </div>
          <p className="mb-2">
            Añade este registro TXT en tu DNS para verificar{" "}
            <span className="font-mono">{domain.hostname}</span>:
          </p>
          <code className="block text-xs bg-slate-950/80 border border-slate-800 rounded-lg p-2 mt-1">
            Nombre: _zntinel.{domain.hostname}
            <br />
            Valor: {domain.verification_token}
          </code>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm">
          <div className="font-medium mb-1">Dominio verificado</div>
          <p className="text-emerald-300 text-xs">
            {domain.hostname} está verificado. Ya podemos empezar a analizar
            tráfico y ataques.
          </p>
        </div>
      )}

      {/* Modal de onboarding */}
      <DomainOnboardingModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmitDomain={handleSubmitDomain}
      />
    </>
  );



  return (
    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm">
      <div className="font-medium mb-1">Dominio verificado</div>
      <p className="text-emerald-300 text-xs">
        {domain.hostname} está verificado. Ya podemos empezar a analizar tráfico y ataques.
      </p>
    </div>
  );
}

const Dashboard: React.FC = () => {
  const { lang } = useLanguage();
  const t = copy[lang as Lang];

  return (
    <div className="min-h-full bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 lg:px-10 py-8 lg:py-10 space-y-8">
        {/* Título + subtítulo */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-50 tracking-tight">
            {t.title}
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">{t.subtitle}</p>
        </div>

        {/* Estado de dominios / onboarding */}
        <DashboardDomainsWidget />

        {/* Fila de KPIs principales */}
        <div className="grid gap-5 md:grid-cols-4">
          <div className="col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 shadow-inner">
            <div className="text-xs font-medium text-slate-400">
              {t.kpis.trafficTitle}
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-semibold text-slate-50">
                128.4k
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                {t.kpis.trafficSub}
              </span>
            </div>
            <div className="mt-4 h-20 rounded-xl bg-gradient-to-r from-cyan-500/20 via-sky-500/10 to-emerald-400/20 opacity-90" />
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5">
            <div className="text-xs font-medium text-slate-400">
              {t.kpis.attacksTitle}
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-50">8,742</div>
            <p className="mt-2 text-xs text-slate-500">{t.kpis.attacksSub}</p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5">
            <div className="text-xs font-medium text-slate-400">
              {t.kpis.uptimeTitle}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-emerald-400">
                99.99%
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{t.kpis.uptimeSub}</p>
          </div>
        </div>

        {/* Segunda fila: salud de protección + latencia + anomalías */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Protección */}
          <section className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 lg:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  {t.sections.protectionTitle}
                </h2>
                <p className="mt-1 text-xs text-slate-500 max-w-xl">
                  {t.sections.protectionDesc}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-300">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Shield score · 92/100
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4">
                <div className="text-xs font-medium text-slate-400">
                  WAF coverage
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-50">
                  37 zonas
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  {t.sections.protectionItems[0]}
                </p>
              </div>
              <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4">
                <div className="text-xs font-medium text-slate-400">
                  Bot defense
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-50">
                  96%
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  {t.sections.protectionItems[1]}
                </p>
              </div>
              <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4">
                <div className="text-xs font-medium text-slate-400">
                  Availability
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-50">
                  12 regiones
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  {t.sections.protectionItems[2]}
                </p>
              </div>
            </div>
          </section>

          {/* Latencia + anomalías */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-slate-100">
                    {t.kpis.latencyTitle}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {t.kpis.latencySub}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-slate-50">
                    72 ms
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    −8 ms last 7d
                  </div>
                </div>
              </div>
              <div className="mt-3 h-14 rounded-lg bg-gradient-to-r from-fuchsia-500/20 via-cyan-400/10 to-sky-500/20" />
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-100">
                    {t.sections.anomaliesTitle}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {t.sections.anomaliesDesc}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
                  0 critical
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                {t.sections.anomaliesEmpty}
              </p>
            </div>
          </section>
        </div>

        {/* Tercera fila: top clientes + actividad seguridad */}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Top clientes */}
          <section className="lg:col-span-3 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 lg:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  {t.sections.topClientsTitle}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {t.sections.topClientsDesc}
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800/80">
              <table className="min-w-full divide-y divide-slate-800 text-xs">
                <thead className="bg-slate-950/60 text-slate-400">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">
                      {t.table.client}
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      {t.table.attacks}
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      {t.table.status}
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      {t.table.risk}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                  {fakeClients.map((c) => (
                    <tr key={c.name} className="hover:bg-slate-900/80">
                      <td className="px-4 py-2 text-slate-100">{c.name}</td>
                      <td className="px-4 py-2 text-slate-100">{c.attacks}</td>
                      <td className="px-4 py-2">
                        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/5 px-2 py-0.5 text-[11px] text-emerald-300">
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-300">{c.risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Actividad seguridad */}
          <section className="lg:col-span-2 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-5 lg:p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                {t.sections.activityTitle}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {t.sections.activityDesc}
              </p>
            </div>

            <div className="space-y-3">
              {fakeActivity.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3"
                >
                  <div className="mt-0.5 text-[11px] font-mono text-slate-500 min-w-[3rem]">
                    {item.time}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-100">
                      {item.event}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {item.source}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
