export interface Project {
  id: number;
  name: string;
  api_key: string;
  created_at: string;
}

export interface Issue {
  id: number;
  title: string;
  fingerprint: string;
  count: number;
  last_seen: string;
  created_at: string;
}

export interface Monitor {
  id: number;
  name: string;
  url: string;
  interval_seconds: number;
  expected_status: number;
  is_active: boolean;
  current_status: 'up' | 'down' | 'unknown';
}

export interface AuthTokens {
  access: string;
  refresh: string;
}