import axios, { type AxiosRequestConfig, type AxiosError, type AxiosResponse } from 'axios';
import { Status } from '@/enum/http';
import { Result } from '@/types/http';
// import { message } from 'antd';
import { refreshToken } from './room'; // 导入refreshToken函数

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
    // 在请求被发送之前做些什么
    // config.headers.Authorization = "Bearer Token";
    return config;
  },
  error => {
    // 请求错误时做些什么
    return Promise.reject(error);
  }
);

// 需要进行权限处理的接口路径模式
const ROOM_API_PATTERNS = ['/acquire/room/', '/splendor/room/'];

// 响应拦截
axiosInstance.interceptors.response.use(
  (res: AxiosResponse<Result>) => {
    const { status_code, data, message } = res.data;

    if (status_code === Status.Succeed) {
      return data;
    }

    throw new Error(message);
  },
  async (error: AxiosError<Result>) => {
    const { response, config } = error || {};

    // 判断是否是需要处理权限的room相关接口
    const isRoomApi = config?.url && ROOM_API_PATTERNS.some(pattern => config.url?.includes(pattern));
    // 如果是room相关接口且返回401错误
    if (isRoomApi && response?.status === 401) {
      const originalRequest = (config as AxiosRequestConfig & { _retry?: boolean });
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          // 尝试刷新token
          await refreshToken();
          return axiosInstance.request(originalRequest);
        } catch (refreshError) {
          // window.location.href = 'https://auth.gamebus.online?redirect=' + window.location.href;
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }

    // 其他错误处理保持不变
    // const errMsg = response?.data?.message || error?.message;
    // message.error(errMsg);

    // const status = response?.status;
    // if (status === 401) {
    // userStore.getState().actions.clearUserInfoAndToken();
    // }
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
