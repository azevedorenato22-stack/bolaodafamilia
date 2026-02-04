import axios from 'axios';

const resolveBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    const fromEnv = process.env.NEXT_PUBLIC_API_URL;
    if (fromEnv.startsWith('http')) return fromEnv;
    return `http://${fromEnv.replace(/^\/+/, '')}`;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, host } = window.location;

    // Ambiente local: mantém API na porta 3001
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3001`;
    }

    // Ambiente publicado (ex.: Cloudflare Tunnel): usa o mesmo host do app
    return `${protocol}//${host}`;
  }

  return 'http://localhost:3001';
};

const api = axios.create({
  baseURL: resolveBaseURL(),
});

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
