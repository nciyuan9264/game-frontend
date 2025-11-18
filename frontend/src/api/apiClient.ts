import axios, { type AxiosRequestConfig, type AxiosError, type AxiosResponse } from 'axios';
import { Status } from '@/enum/http';
import { Result } from '@/types/http';
import { message } from 'antd';

// 创建 axios 实例
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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

// 响应拦截
axiosInstance.interceptors.response.use(
  (res: AxiosResponse<Result>) => {
    // if (!res.data) throw new Error();

    const { status_code, data, message } = res.data;

    // 业务请求成功
    const hasSuccess = Reflect.has(res.data, 'status_code') && status_code === Status.Succeed;
    if (hasSuccess) {
      return data;
    }

    // 业务请求错误
    throw new Error(message);
  },
  (error: AxiosError<Result>) => {
    const { response, message: msg } = error || {};

    const errMsg = response?.data?.message || msg;
    message.error(errMsg);

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
