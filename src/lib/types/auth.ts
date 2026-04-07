export interface AuthenticatedAthlete {
  id: number;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  profile?: string | null;
  profile_medium?: string | null;
}

export interface StravaSession {
  athlete: AuthenticatedAthlete;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
  tokenType: string;
}

export interface ClientSession {
  authenticated: boolean;
  athlete: AuthenticatedAthlete | null;
  expiresAt: number | null;
}
