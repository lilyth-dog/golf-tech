import axios from 'axios';

function resolveApiBaseURL(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  // Dev server: use Vite proxy (vite.config.ts) so requests stay on :5173
  if (import.meta.env.DEV) return '/api';
  return 'http://localhost:8000/api';
}

const baseURL = resolveApiBaseURL();

const client = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default client;
