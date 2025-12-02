import axios from "axios";
// src/lib/api.ts
const API_BASE = import.meta.env.VITE_API_URL ?? "https://api.zntinel.com";

export async function fetchDomains() {
  const res = await fetch(`${API_BASE}/domains`, {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Error loading domains");
  }

  return data.domains as Array<{
    id: string;
    hostname: string;
    dns_status: "pending" | "ok";
    verification_token: string;
  }>;
}


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.zntinel.com",
  withCredentials: true, // MUY importante para que viaje la cookie 'session'
});

export default api;
