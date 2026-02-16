// In production (Docker), use relative URLs since backend serves frontend
// In development, use the environment variable to proxy to backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
