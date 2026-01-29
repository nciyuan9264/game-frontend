import { UserProfile } from '@/hooks/request/useProfile';

export const profile2BackendName = (userProfile: UserProfile) => {
  if(!userProfile.name || !userProfile.id) return '';
  return `${userProfile.name}-${userProfile.id}`;
};

export const backendName2FrontendName = (backendName: string) => {
  return backendName.split('-')[0];
};
