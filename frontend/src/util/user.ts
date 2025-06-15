// utils/user.ts

function generateUUIDFallback(): string {
  return 'xxxxxxxx'.replace(/[xy]/g, c => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
export function getLocalStorageUserID(): string {
  let userId = localStorage.getItem('userId') ?? '';
  return userId;
}

export function setLocalStorageUserID(name: string): string {
  const uuid = generateUUIDFallback();
  const userId = `${name}-${uuid}`;
  localStorage.setItem('userId', userId);
  return userId;
}

export function getLocalStorageUserName(userID: string): string {
  return userID.split('-')[0];
}

export function validateUserName(userID: string): boolean {
  const name = getLocalStorageUserName(userID);
  return /^[a-zA-Z]+$/.test(name);
}