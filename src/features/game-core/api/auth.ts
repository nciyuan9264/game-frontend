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
  roles: string[];
}

export function hasAdminRole(
  profile?: Pick<AuthProfile, 'roles'>,
): boolean {
  return profile?.roles.some(role => role.toLowerCase() === 'admin') ?? false;
}

export async function refreshToken() {
  return Refresh();
}

export async function getProfile(options?: { suppressAuthRedirect?: boolean }): Promise<AuthProfile> {
  const response = await GetProfile(options);
  const displayName = response.data.display_name ?? response.data.name ?? '';
  return {
    id: response.data.user_id,
    email: response.data.email ?? '',
    name: displayName,
    displayName,
    avatar: response.data.avatar ?? '',
    roles: response.data.roles ?? [],
  };
}

export async function logout() {
  return Logout();
}
