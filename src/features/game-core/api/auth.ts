import {
  GetProfile,
  Logout,
  Refresh,
} from '@/api/generated/auth';

export interface AuthProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export async function refreshToken() {
  return Refresh();
}

export async function getProfile(): Promise<AuthProfile> {
  const response = await GetProfile();
  return {
    id: response.data.user_id,
    email: response.data.email ?? '',
    name: response.data.name ?? response.data.display_name ?? '',
    avatar: response.data.avatar ?? '',
  };
}

export async function logout() {
  return Logout();
}
