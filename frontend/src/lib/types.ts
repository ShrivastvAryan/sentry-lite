export interface Project {
  id: number;
  name: string;
  api_key: string;
  created_at: string;
  platform?: string;
  issues_count?: number;
  monitors_count?: number;
}

export interface Issue {
  id: number;
  title: string;
  fingerprint: string;
  count: number;
  last_seen: string;
  created_at: string;
  type?: string;
  culprit?: string;
  message?: string;
  status?: 'unhandled' | 'resolved' | 'ignored';
  users_count?: number;
  environment?: string;
  handled?: boolean;
  stack_trace?: string[];
}

export interface Monitor {
  id: number;
  name: string;
  url: string;
  interval_seconds: number;
  expected_status: number;
  is_active: boolean;
  current_status: 'up' | 'down' | 'unknown';
  last_checked?: string;
  response_time_ms?: number;
  uptime_percentage?: number;
  status_history?: ('up' | 'down' | 'unknown')[];
  method?: 'GET' | 'POST' | 'HEAD';
  last_error?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}