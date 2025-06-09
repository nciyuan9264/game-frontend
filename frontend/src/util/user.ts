// utils/user.ts

function generateUUIDFallback(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] % 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
export function getOrCreateUserId(): string {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    if (crypto.randomUUID) {
      userId = crypto.randomUUID();
    } else {
      userId = generateUUIDFallback();
    }
    localStorage.setItem("userId", userId);
  }
  return userId;
}
