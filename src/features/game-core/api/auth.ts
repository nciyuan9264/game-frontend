import {
  GetProfile,
  Logout,
  Refresh,
} from '@/api/generated/auth';

export interface AuthProfile {
  id: string;
  email: string;
  name: string;
  displayName: string;
  avatar: string;
}

export async function refreshToken() {
  return Refresh();
}

export async function getProfile(): Promise<AuthProfile> {
  const response = await GetProfile();
  const displayName = response.data.display_name ?? response.data.name ?? '';
  return {
    id: response.data.user_id,
    email: response.data.email ?? '',
    name: displayName,
    displayName,
    avatar: response.data.avatar ?? '',
  };
}

export async function logout() {
  return Logout();
}
