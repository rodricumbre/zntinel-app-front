import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.zntinel.com",
  withCredentials: true, // MUY importante para que viaje la cookie 'session'
});

export default api;
