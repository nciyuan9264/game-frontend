import { local } from "@/const/env";
import useAxios from "axios-hooks";

/**
 * 注册用户 Hook
 * 直接调用 `register()` 触发请求
 */
export const useRegister = () => {
  const [{ data, loading, error }, register] = useAxios(
    {
      url: `${local}:3000/register`, // 指定完整 URL
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // 允许跨域携带 Cookie
    },
    { manual: true } // 需要手动触发请求
  );

  return { data, loading, error, register };
};


export const useLogin = () => {
  const [{ data, loading, error }, login] = useAxios(
    {
      url: `${local}:3000/login`, // 登录接口
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // 允许跨域携带 Cookie
    },
    { manual: true } // 需要手动触发请求
  );

  return { data, loading, error, login };
};

export const useCheck = () => {
  const [{ data, loading, error }, check] = useAxios(
    {
      url: `${local}:3000/check`, // 登录接口
      method: "GET",
      withCredentials: true, // 允许跨域携带 Cookie
    },
    { manual: true } // 需要手动触发请求
  );
  return { data, loading, error, check };
};

export const useLogout = () => {
  const [ , logout] = useAxios(
    {
      url: `${local}:3000/logout`, // 登录接口
      method: "GET",
      withCredentials: true, // 允许跨域携带 Cookie
    },
    { manual: true } // 需要手动触发请求
  );
  return { logout };
};