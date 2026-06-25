import { User } from '../models/auth.model';

const TOKEN_KEY = 'lupa_insights_token';
const USER_KEY = 'lupa_insights_user';
const LEGACY_TOKEN_KEY = 'lupa_cnpj_token';
const LEGACY_USER_KEY = 'lupa_cnpj_user';

function migrateLegacyKey(newKey: string, legacyKey: string): void {
  if (localStorage.getItem(newKey)) {
    return;
  }
  const legacy = localStorage.getItem(legacyKey);
  if (!legacy) {
    return;
  }
  localStorage.setItem(newKey, legacy);
  localStorage.removeItem(legacyKey);
}

export class AuthStorage {
  static salvarToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static recuperarToken(): string | null {
    migrateLegacyKey(TOKEN_KEY, LEGACY_TOKEN_KEY);
    return localStorage.getItem(TOKEN_KEY);
  }

  static salvarUsuario(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static recuperarUsuario(): User | null {
    migrateLegacyKey(USER_KEY, LEGACY_USER_KEY);
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  static limpar(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  }
}
