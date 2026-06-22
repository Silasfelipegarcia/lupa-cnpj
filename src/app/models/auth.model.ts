export interface User {
  id: string;
  nome: string;
  email: string;
  cpf: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  cpf: string;
  password: string;
}
