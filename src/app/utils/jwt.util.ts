export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getJwtExpirationMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }
  const exp = payload['exp'];
  if (typeof exp !== 'number') {
    return null;
  }
  return exp * 1000;
}

export function isJwtExpired(token: string): boolean {
  const expirationMs = getJwtExpirationMs(token);
  if (expirationMs === null) {
    return true;
  }
  return Date.now() >= expirationMs;
}
