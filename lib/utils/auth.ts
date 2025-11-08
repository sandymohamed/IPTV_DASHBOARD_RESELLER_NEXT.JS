/**
 * Authentication utilities
 */

export function jwtDecode(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
    return null;
  }
}

export function isValidToken(accessToken: string | null): boolean {
  if (!accessToken) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
    return false;
  }

  const decoded = jwtDecode(accessToken);
  if (!decoded) return false;

  const currentTime = Date.now() / 1000;
  return decoded.exp > currentTime;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function getUserFromToken() {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const decoded = window.atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

export function setSession(accessToken: string | null) {
  if (typeof window === 'undefined') return;

  const clearSession = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  };

  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
    const decoded = jwtDecode(accessToken);
    if (decoded?.exp) {
      const expiryDate = new Date(decoded.exp * 1000);
      const cookieParts = [
        `accessToken=${accessToken}`,
        'path=/',
        `expires=${expiryDate.toUTCString()}`,
        'SameSite=Lax',
      ];
      if (window.location.protocol === 'https:') {
        cookieParts.push('Secure');
      }
      document.cookie = cookieParts.join('; ');

      const timeLeft = expiryDate.getTime() - Date.now();
      if (timeLeft > 0) {
        setTimeout(() => {
          clearSession();
          window.location.href = '/auth/login';
        }, timeLeft);
      }
    } else {
      // Fallback cookie without expiry if token can't be decoded
      document.cookie = `accessToken=${accessToken}; path=/; SameSite=Lax${
        window.location.protocol === 'https:' ? '; Secure' : ''
      }`;
    }
  } else {
    clearSession();
  }
}
