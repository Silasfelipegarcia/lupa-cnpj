import { User } from '../models/auth.model';

const TOKEN_KEY = 'lupa_cnpj_token';
const USER_KEY = 'lupa_cnpj_user';

export class AuthStorage {
  static salvarToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static recuperarToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static salvarUsuario(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static recuperarUsuario(): User | null {
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
  }
}
