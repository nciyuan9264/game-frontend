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
  message?: string;
}

export const apiInstance = axios.create({
  baseURL: '/pam-api',
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
    const message = reason.response?.data?.message;
    return Promise.reject(new Error(message || reason.message || '服务暂时不可用，请稍后重试'));
  },
);

export function generatedRequest<R>(
  params: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<R> {
  return apiInstance.request<R>({ ...params, ...options }).then(response => response.data);
}
