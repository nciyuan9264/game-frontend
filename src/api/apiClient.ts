import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { Status } from '@/enum/http';
import { Result } from '@/types/http';
import { refreshToken } from './room';

// 创建 axios 实例
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 50000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json;charset=utf-8' },
});

// 请求拦截
axiosInstance.interceptors.request.use(
  config => {
    return config;
  },
  error => {
    // 请求错误时做些什么
    return Promise.reject(error);
  }
);

// 响应拦截
axiosInstance.interceptors.response.use(
  (res: AxiosResponse<Result>) => {
    const { status_code, data, message } = res.data;

    if (status_code === Status.Succeed) {
      return data;
    }

    throw new Error(message);
  },
  async (error) => {
    const { response, config: originalRequest } = error || {};

    // 如果是room相关接口且返回401错误
    if (response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        // 尝试刷新token
        await refreshToken();
        return axiosInstance.request(originalRequest);
      } catch (refreshError) {
        // window.location.href = 'https://auth.gamebus.online/login?redirect=' + window.location.href;
        return Promise.reject(refreshError);
      }
    }

    // 提取后端在错误响应体里返回的 message，方便上层 onError 直接展示
    const backendMessage = response?.data?.message;
    if (backendMessage) {
      return Promise.reject(new Error(backendMessage));
    }
    return Promise.reject(error);
  }
);

class APIClient {
  get<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'GET' });
  }

  post<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'POST' });
  }

  put<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'PUT' });
  }

  delete<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.request({ ...config, method: 'DELETE' });
  }

  request<T = any>(config: AxiosRequestConfig): Promise<T> {
    return axiosInstance
      .request<any, AxiosResponse<Result>>(config)
      .then(res => res as unknown as T)
      .catch(e => Promise.reject(e));
  }
}
export default new APIClient();
