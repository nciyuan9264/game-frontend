export const rootFontSize = 20;

export const baseURL = import.meta.env.VITE_API_BASE_URL;
export const authApiBaseURL = (
  import.meta.env.VITE_AUTH_API_BASE_URL ||
  `${baseURL.replace(/\/$/, '')}/pam-api/platform/auth`
).replace(/\/$/, '');
export const acquireWsUrl = import.meta.env.VITE_ACQUIRE_WS_URL;
export const davinciWsUrl = import.meta.env.VITE_DAVINCI_WS_URL;
export const splendorWsUrl = import.meta.env.VITE_SPLENDOR_WS_URL;
