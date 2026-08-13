export type Role = 'client' | 'transporteur';

export interface User {
  id: string;
  email: string;
  nom: string;
  role: Role;
  transporteurId?: string;   // présent uniquement pour les comptes transporteur
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}