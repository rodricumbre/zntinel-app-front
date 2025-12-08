// src/components/pages/LogsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import PageCard from "@/components/layout/PageCard";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.zntinel.com";

type LogAction = "ALLOWED" | "BLOCKED" | string;

type LogEntry = {
  id: string;
  timestamp: string; // ISO
  hostname: string | null;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  action: LogAction | null;
  threatType: string | null;
  ruleId?: string | null;
  country?: string | null;
};

type LogsApiResponse = {
  success: boolean;
  logs: LogEntry[];
};

type TimeRange = "1h" | "24h" | "7d" | "30d";

const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [actionFilter, setActionFilter] =
    useState<"all" | "ALLOWED" | "BLOCKED">("all");
  const [threatFilter, setThreatFilter] = useState<string | "all">("all");

  // “IA” local
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      setLoading(true);
      setError(null);

      try {
        const url = new URL(`${API_BASE_URL}/logs`);
        url.searchParams.set("range", timeRange);

        const res = await fetch(url.toString(), {
          method: "GET",
          credentials: "include",
        });

        const data = (await res.json()) as LogsApiResponse | any;

        if (!res.ok || data.success === false) {
          throw new Error(data?.error || `HTTP ${res.status} en /logs`);
        }

        const logsFromApi: LogEntry[] = data.logs || [];
        if (!cancelled) {
          setLogs(logsFromApi);
        }
      } catch (e: any) {
        console.error("[LOGS] error", e);
        if (!cancelled) {
          setError(e?.message || "Error cargando logs");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLogs();
    return () => {
      cancelled = true;
    };
  }, [timeRange]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (actionFilter !== "all") {
        const a = (l.action || "").toUpperCase();
        if (a !== actionFilter) return false;
      }

      if (threatFilter !== "all") {
        if ((l.threatType || "") !== threatFilter) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [
          l.hostname || "",
          l.method || "",
          l.path || "",
          String(l.statusCode ?? ""),
          l.threatType || "",
          l.ruleId || "",
          l.country || "",
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [logs, actionFilter, threatFilter, search]);

  function formatTop<T>(
    items: T[],
    key: (x: T) => string,
    topN: number
  ): { value: string; count: number }[] {
    const map = new Map<string, number>();
    for (const it of items) {
      const k = key(it);
      if (!k) continue;
      map.set(k, (map.get(k) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([value, count]) => ({ value, count }));
  }

  function isSuspiciousPath(path: string | null): boolean {
    const p = (path || "").toLowerCase();
    const keywords = [
      "wp-login",
      "xmlrpc",
      "admin",
      "login",
      "phpmyadmin",
      "shell",
      ".env",
      "config.php",
      "/api/auth",
    ];
    return keywords.some((k) => p.includes(k));
  }

  function buildLocalAiAnalysis(
    question: string,
    logsInScope: LogEntry[],
    range: TimeRange
  ): string {
    if (logsInScope.length === 0) {
      return `Con los filtros actuales no hay eventos que analizar. Prueba ampliando el rango temporal o quitando filtros.`;
    }

    const total = logsInScope.length;
    const blocked = logsInScope.filter(
      (l) => (l.action || "").toUpperCase() === "BLOCKED"
    ).length;
    const blockedPct = total > 0 ? (blocked / total) * 100 : 0;

    const errors5xx = logsInScope.filter(
      (l) => (l.statusCode || 0) >= 500
    );
    const errors5xxBlocked = errors5xx.filter(
      (l) => (l.action || "").toUpperCase() === "BLOCKED"
    );

    const suspiciousPaths = logsInScope.filter((l) => isSuspiciousPath(l.path));

    const topHosts = formatTop(logsInScope, (l) => l.hostname || "", 5);
    const topBlockedHosts = formatTop(
      logsInScope.filter(
        (l) => (l.action || "").toUpperCase() === "BLOCKED"
      ),
      (l) => l.hostname || "",
      5
    );
    const topRules = formatTop(
      logsInScope.filter((l) => l.ruleId || ""),
      (l) => l.ruleId || "",
      5
    );
    const topThreats = formatTop(
      logsInScope.filter((l) => l.threatType),
      (l) => l.threatType || "",
      5
    );

    const lines: string[] = [];

    lines.push(
      `He analizado ${total.toLocaleString(
        "es-ES"
      )} eventos para el rango ${range} con los filtros actuales.`
    );
    lines.push(
      `• Bloqueos: ${blocked.toLocaleString(
        "es-ES"
      )} (${blockedPct.toFixed(1)}% del total).`
    );

    if (errors5xx.length > 0) {
      lines.push(
        `• Errores 5xx detectados: ${errors5xx.length.toLocaleString(
          "es-ES"
        )} (${errors5xxBlocked.length.toLocaleString(
          "es-ES"
        )} fueron además bloqueados por el WAF/bot).`
      );
    } else {
      lines.push(`• No se observan respuestas 5xx en los eventos filtrados.`);
    }

    if (suspiciousPaths.length > 0) {
      const topSuspicious = formatTop(
        suspiciousPaths,
        (l) => l.path || "",
        5
      );
      lines.push(
        `• Rutas potencialmente sensibles o atacadas (login/admin/etc.):`
      );
      for (const item of topSuspicious) {
        lines.push(
          `   - ${item.value} → ${item.count.toLocaleString("es-ES")} hits`
        );
      }
    }

    if (topThreats.length > 0) {
      lines.push(`• Tipos de amenaza más frecuentes:`);
      for (const t of topThreats) {
        lines.push(
          `   - ${t.value} → ${t.count.toLocaleString("es-ES")} eventos`
        );
      }
    }

    if (topRules.length > 0) {
      lines.push(`• Reglas que más se disparan:`);
      for (const r of topRules) {
        lines.push(
          `   - ${r.value} → ${r.count.toLocaleString("es-ES")} matches`
        );
      }
      lines.push(
        `  Si ves reglas con mucho volumen que sabes que son tráfico legítimo, revísalas como posibles falsos positivos.`
      );
    }

    if (topHosts.length > 0) {
      lines.push(`• Hosts más activos (todo el tráfico):`);
      for (const h of topHosts) {
        lines.push(
          `   - ${h.value} → ${h.count.toLocaleString("es-ES")} eventos`
        );
      }
    }

    if (topBlockedHosts.length > 0) {
      lines.push(`• Hosts con más bloqueos:`);
      for (const h of topBlockedHosts) {
        lines.push(
          `   - ${h.value} → ${h.count.toLocaleString("es-ES")} bloqueos`
        );
      }
    }

    const clave: string[] = [];

    if (errors5xx.length > 0) {
      const top5xxPaths = formatTop(
        errors5xx,
        (l) => `${l.hostname || ""}${l.path || ""}`,
        5
      );
      clave.push(`- Rutas con más errores 5xx:`);
      for (const p of top5xxPaths) {
        clave.push(
          `   · ${p.value} → ${p.count.toLocaleString("es-ES")} errores 5xx`
        );
      }
    }

    const repeated404 = logsInScope.filter(
      (l) => l.statusCode === 404 && isSuspiciousPath(l.path)
    );
    if (repeated404.length > 0) {
      const top404 = formatTop(
        repeated404,
        (l) => `${l.hostname || ""}${l.path || ""}`,
        5
      );
      clave.push(
        `- 404 repetidos en rutas sensibles (probable scanning/enum de recursos):`
      );
      for (const p of top404) {
        clave.push(
          `   · ${p.value} → ${p.count.toLocaleString("es-ES")} veces (404)`
        );
      }
    }

    if (clave.length > 0) {
      lines.push("");
      lines.push("Posibles errores clave / puntos a revisar:");
      lines.push(...clave);
    }

    if (question.trim()) {
      lines.push("");
      lines.push(`Pregunta del usuario: "${question.trim()}"`);
      lines.push(
        `→ Usa los puntos anteriores para responderla: céntrate en hosts ruidosos, reglas con más matches y rutas con errores 5xx/404 en recursos sensibles.`
      );
    }

    return lines.join("\n");
  }

  const handleAskAi = () => {
    const q = aiQuestion.trim();
    setAiLoading(true);
    setAiError(null);

    try {
      const answer = buildLocalAiAnalysis(q, filteredLogs, timeRange);
      setAiAnswer(answer);
    } catch (e: any) {
      console.error("[LOGS_LOCAL_AI] error", e);
      setAiError("Error analizando logs localmente.");
    } finally {
      setAiLoading(false);
    }
  };

  const threatBadge = (t: string | null) => {
    if (!t || t === "none") {
      return (
        <span className="inline-flex items-center rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300">
          clean
        </span>
      );
    }

    const labelMap: Record<string, string> = {
      sql_injection: "SQLi",
      xss: "XSS",
      bot: "Bot",
      lfi: "LFI",
      rce: "RCE",
    };

    const label = labelMap[t] || t;

    return (
      <span className="inline-flex items-center rounded-full bg-rose-500/15 border border-rose-500/40 px-2 py-0.5 text-[10px] text-rose-200">
        {label}
      </span>
    );
  };

  const actionBadge = (a: LogAction | null) => {
    const value = (a || "ALLOWED").toUpperCase();
    if (value === "BLOCKED") {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-500/15 border border-rose-500/40 px-2 py-0.5 text-[10px] text-rose-200">
          BLOCKED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/40 px-2 py-0.5 text-[10px] text-emerald-200">
        ALLOWED
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">Logs</h1>
          <p className="text-sm text-slate-400">
            Inspecciona el tráfico reciente y deja que la capa de análisis te
            resuma los errores clave y rutas sensibles.
          </p>
        </div>

        {/* filtros de rango y acción */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Rango:</span>
            {(["1h", "24h", "7d", "30d"] as TimeRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-2 py-1 rounded-full border transition ${
                  timeRange === r
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                    : "border-slate-700 text-slate-400 hover:border-cyan-400/60 hover:text-cyan-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Acción:</span>
            {(["all", "ALLOWED", "BLOCKED"] as const).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() =>
                  setActionFilter(val === "all" ? "all" : val)
                }
                className={`px-2 py-1 rounded-full border transition ${
                  actionFilter === val ||
                  (val === "all" && actionFilter === "all")
                    ? "border-sky-400 bg-sky-500/10 text-sky-200"
                    : "border-slate-700 text-slate-400 hover:border-sky-400/60 hover:text-sky-200"
                }`}
              >
                {val === "all" ? "Todas" : val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Zona principal: tabla + panel AI local */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] gap-4">
        {/* Tabla de logs */}
        <PageCard
          title="Eventos recientes"
          subtitle="Filtra por texto, acción o tipo de amenaza para revisar eventos concretos."
        >
          {/* barra de búsqueda + filtro de amenaza */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
            <input
              type="text"
              className="w-full md:flex-1 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/60"
              placeholder="Buscar por dominio, URL, regla, país..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="w-full md:w-40 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/60"
              value={threatFilter}
              onChange={(e) =>
                setThreatFilter(e.target.value as string | "all")
              }
            >
              <option value="all">Todos los tipos</option>
              <option value="none">Sin amenaza</option>
              <option value="sql_injection">SQL injection</option>
              <option value="xss">XSS</option>
              <option value="bot">Bots</option>
              <option value="lfi">LFI</option>
              <option value="rce">RCE</option>
              <option value="other">Otros</option>
            </select>
          </div>

          {loading && (
            <p className="text-xs text-slate-400">Cargando logs…</p>
          )}

          {error && !loading && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {!loading && !error && filteredLogs.length === 0 && (
            <p className="text-xs text-slate-400">
              No hay eventos que coincidan con los filtros actuales.
            </p>
          )}

          {!loading && !error && filteredLogs.length > 0 && (
            <div className="border border-slate-800/80 rounded-xl overflow-auto bg-slate-950/60 max-h-[520px]">
              <table className="min-w-full text-[11px]">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800/80">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">
                      Fecha / Hora
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Dominio / URL
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Acción
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Tipo
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Regla
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      País
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-slate-800/70 last:border-0 hover:bg-slate-900/40 transition"
                    >
                      <td className="px-3 py-2 text-slate-300 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2 text-slate-100">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">
                            {log.hostname || "—"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {(log.method || "GET") +
                              " " +
                              (log.path || "/")}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {actionBadge(log.action)}
                      </td>
                      <td className="px-3 py-2">
                        {threatBadge(log.threatType)}
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {log.ruleId || "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {log.statusCode ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {log.country || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageCard>

        {/* Panel “IA” local */}
        <PageCard
          title="Análisis de errores clave"
          subtitle="Resumen automático de hosts ruidosos, rutas sensibles, reglas calientes y errores 5xx."
        >
          <div className="space-y-3">
            <textarea
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 outline-none ring-0 transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/60 min-h-[120px]"
              placeholder="Opcional: describe qué quieres que priorice (p.ej. 'falsos positivos en login', 'errores 5xx en /checkout'). Si lo dejas vacío, te dará un resumen genérico."
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
            />

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Usa los filtros (rango, acción, tipo) y después genera el
                análisis sobre esos eventos filtrados.
              </span>
              <button
                type="button"
                onClick={handleAskAi}
                disabled={aiLoading}
                className="rounded-full bg-cyan-400 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {aiLoading ? "Analizando…" : "Analizar errores clave"}
              </button>
            </div>

            {aiError && (
              <div className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-[11px] text-red-300">
                {aiError}
              </div>
            )}

            {aiAnswer && (
              <div className="mt-1 rounded-xl border border-slate-800/80 bg-slate-950/70 px-3 py-3 text-[11px] text-slate-200 whitespace-pre-line">
                {aiAnswer}
              </div>
            )}

            {!aiAnswer && !aiError && (
              <p className="text-[11px] text-slate-500">
                Tip: filtra por{" "}
                <span className="text-slate-300">BLOCKED</span> + tipo de
                amenaza y luego genera el análisis para ver fácilmente hosts,
                rutas y reglas críticas sobre las que deberías actuar.
              </p>
            )}
          </div>
        </PageCard>
      </div>
    </div>
  );
};

export default LogsPage;
