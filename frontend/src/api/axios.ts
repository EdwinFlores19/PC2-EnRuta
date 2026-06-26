/**
 * src/api/axios.ts — Instancia Configurada de Axios (TypeScript)
 */

import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// Extend InternalAxiosRequestConfig to allow _retry flag
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('[API] Error en interceptor de petición:', error);
    return Promise.reject(error);
  }
);

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest as AxiosRequestConfig);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await apiClient.post('/auth/refresh-token');
        const newAccessToken = data.accessToken;

        localStorage.setItem('accessToken', newAccessToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest as AxiosRequestConfig);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');

        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      console.error('[API] Error 403: Sin permisos para esta acción.');
    }

    if (error.response?.status >= 500) {
      console.error('[API] Error del servidor:', error.response?.data?.message || 'Error interno');
    }

    if (!error.response) {
      console.error('[API] Error de red: No se pudo conectar con el servidor.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
