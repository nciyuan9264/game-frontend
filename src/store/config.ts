import { create } from 'zustand';

interface Env {
  apiUrl?: string;
  isProduction?: boolean;
  statusBarHeight?: number;
}

interface PersonStore {
  env: Env;
  setEnv: (newEnv: Env) => void;
}

// 创建 store，并添加返回类型
export const usePersonStore = create<PersonStore>(set => ({
  env: {},
  setEnv: newEnv => set(state => ({ ...state, env: newEnv })),
}));
