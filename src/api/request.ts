import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { Refresh } from './generated/auth';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface ErrorEnvelope {
  error?: string;
  message?: string;
  status_code?: number;
}

export class APIRequestError extends Error {
  constructor(
    message: string,
    public status = 0,
    public code?: string,
  ) {
    super(message);
    this.name = 'APIRequestError';
  }
}

export const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  timeout: 50000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json;charset=utf-8' },
});

apiInstance.interceptors.response.use(
  response => response,
  async (reason: AxiosError<ErrorEnvelope>) => {
    const original = reason.config as RetryableRequestConfig | undefined;
    const refreshRequest = original?.url?.endsWith('/platform/auth/refresh');
    if (reason.response?.status === 401 && original && !original._retry && !refreshRequest) {
      original._retry = true;
      try {
        await Refresh();
        return apiInstance.request(original);
      } catch {
        window.location.href = 'https://auth.gamebus.online/login?redirect='
          + encodeURIComponent(window.location.href);
      }
    }
    const data = reason.response?.data;
    const message = data?.message || reason.message || '服务暂时不可用，请稍后重试';
    return Promise.reject(new APIRequestError(
      message,
      reason.response?.status ?? data?.status_code ?? 0,
      data?.error,
    ));
  },
);

export function generatedRequest<R>(
  params: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<R> {
  return apiInstance.request<R>({ ...params, ...options }).then(response => response.data);
}
