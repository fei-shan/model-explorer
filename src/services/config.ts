export const USE_API = import.meta.env.VITE_USE_API === 'true';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
export const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;
