export interface Session {
  id: string;
  userId: number;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface AuthTokenPayload {
  userId: number;
  sessionId: string;
  username: string;
  role: string;
}

export interface LoginResponse {
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
  session: {
    token: string;
    expiresAt: Date;
  };
}
