import { Issue, Monitor } from './types';

export const mockIssues: Issue[] = [
  {
    id: 1,
    title: 'TypeError: cannot read property of undefined',
    fingerprint: 'abc123',
    count: 47,
    last_seen: new Date().toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 2,
    title: 'ReferenceError: x is not defined',
    fingerprint: 'def456',
    count: 12,
    last_seen: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 3,
    title: 'NetworkError: Failed to fetch',
    fingerprint: 'ghi789',
    count: 3,
    last_seen: new Date(Date.now() - 3600000 * 20).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const mockMonitors: Monitor[] = [
  {
    id: 1,
    name: 'Main API Health',
    url: 'https://api.example.com/health',
    interval_seconds: 60,
    expected_status: 200,
    is_active: true,
    current_status: 'up',
  },
  {
    id: 2,
    name: 'Marketing Site',
    url: 'https://example.com',
    interval_seconds: 300,
    expected_status: 200,
    is_active: true,
    current_status: 'down',
  },
  {
    id: 3,
    name: 'Staging Environment',
    url: 'https://staging.example.com',
    interval_seconds: 120,
    expected_status: 200,
    is_active: false,
    current_status: 'unknown',
  },
];