'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Monitor } from '@/lib/types';
import { mockMonitors } from '@/lib/mockData';

type StatusFilter = 'all' | 'up' | 'down' | 'paused';

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return 'Never checked';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function MonitorsPage() {
  const { id } = useParams();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedMonitorId, setExpandedMonitorId] = useState<number | null>(null);
  const [isPingLoading, setIsPingLoading] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Monitor Form State
  const [newMonitorName, setNewMonitorName] = useState('');
  const [newMonitorUrl, setNewMonitorUrl] = useState('');
  const [newMonitorMethod, setNewMonitorMethod] = useState<'GET' | 'POST' | 'HEAD'>('GET');
  const [newMonitorInterval, setNewMonitorInterval] = useState<number>(60);
  const [newMonitorExpectedStatus, setNewMonitorExpectedStatus] = useState<number>(200);

  useEffect(() => {
    // TODO: replace with real API call — api.get(`/projects/${id}/monitors/`)
    setMonitors(mockMonitors);
  }, [id]);

  // Aggregate KPI stats
  const kpiStats = useMemo(() => {
    const total = monitors.length;
    const upCount = monitors.filter((m) => m.is_active && m.current_status === 'up').length;
    const downCount = monitors.filter((m) => m.is_active && m.current_status === 'down').length;
    const pausedCount = monitors.filter((m) => !m.is_active).length;

    const activeMonitors = monitors.filter((m) => m.is_active && m.response_time_ms);
    const avgResponseTime = activeMonitors.length
      ? Math.round(activeMonitors.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / activeMonitors.length)
      : 0;

    const avgUptime = monitors.length
      ? (monitors.reduce((sum, m) => sum + (m.uptime_percentage || 100), 0) / monitors.length).toFixed(2)
      : '100.00';

    return {
      total,
      upCount,
      downCount,
      pausedCount,
      avgResponseTime,
      avgUptime,
      isSystemHealthy: downCount === 0,
    };
  }, [monitors]);

  // Filtered monitors list
  const filteredMonitors = useMemo(() => {
    return monitors.filter((m) => {
      // Status filter
      if (statusFilter === 'up' && (m.current_status !== 'up' || !m.is_active)) return false;
      if (statusFilter === 'down' && (m.current_status !== 'down' || !m.is_active)) return false;
      if (statusFilter === 'paused' && m.is_active) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = m.name.toLowerCase().includes(q);
        const urlMatch = m.url.toLowerCase().includes(q);
        const methodMatch = (m.method || '').toLowerCase().includes(q);
        return nameMatch || urlMatch || methodMatch;
      }

      return true;
    });
  }, [monitors, statusFilter, searchQuery]);

  // Toggle Pause / Active state
  const handleToggleActive = (monitorId: number) => {
    setMonitors((prev) =>
      prev.map((m) =>
        m.id === monitorId
          ? {
              ...m,
              is_active: !m.is_active,
              current_status: !m.is_active ? 'up' : 'unknown',
            }
          : m
      )
    );
  };

  // Trigger manual ping test
  const handleTriggerPing = (monitorId: number) => {
    setIsPingLoading(monitorId);
    setTimeout(() => {
      setMonitors((prev) =>
        prev.map((m) => {
          if (m.id === monitorId) {
            const isSuccess = m.current_status !== 'down';
            return {
              ...m,
              last_checked: new Date().toISOString(),
              response_time_ms: isSuccess ? Math.floor(Math.random() * 80) + 40 : 5000,
              status_history: [...(m.status_history || []).slice(1), m.current_status],
            };
          }
          return m;
        })
      );
      setIsPingLoading(null);
    }, 800);
  };

  // Add new monitor
  const handleAddMonitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonitorName || !newMonitorUrl) return;

    const created: Monitor = {
      id: Date.now(),
      name: newMonitorName,
      url: newMonitorUrl,
      method: newMonitorMethod,
      interval_seconds: Number(newMonitorInterval),
      expected_status: Number(newMonitorExpectedStatus),
      is_active: true,
      current_status: 'up',
      response_time_ms: 95,
      uptime_percentage: 100,
      last_checked: new Date().toISOString(),
      status_history: ['up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up'],
    };

    setMonitors((prev) => [created, ...prev]);
    setShowAddModal(false);
    setNewMonitorName('');
    setNewMonitorUrl('');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans pb-16">
      {/* Top Header Navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                <Link href="/projects" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                  Projects
                </Link>
                <span>/</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">Project #{id}</span>
                <span>/</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-medium">Uptime Monitors</span>
              </div>

              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">System Monitors</h1>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    kpiStats.isSystemHealthy
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${kpiStats.isSystemHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-bounce'}`} />
                  {kpiStats.isSystemHealthy ? 'All Systems Operational' : `${kpiStats.downCount} Incident Active`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Monitor
              </button>
            </div>
          </div>

          {/* Stats KPI Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Monitors</div>
              <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-50">{kpiStats.total}</div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Monitors Online</div>
              <div className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {kpiStats.upCount} <span className="text-xs font-normal text-zinc-400">/ {kpiStats.total}</span>
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Avg Latency</div>
              <div className="text-xl font-bold mt-1 text-blue-600 dark:text-blue-400 font-mono">
                {kpiStats.avgResponseTime} <span className="text-xs font-normal text-zinc-400">ms</span>
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Avg Uptime (30d)</div>
              <div className="text-xl font-bold mt-1 text-purple-600 dark:text-purple-400 font-mono">
                {kpiStats.avgUptime}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Toolbar & Filters */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-fit">
              {(['all', 'up', 'down', 'paused'] as StatusFilter[]).map((tab) => {
                const count =
                  tab === 'all'
                    ? monitors.length
                    : tab === 'up'
                    ? monitors.filter((m) => m.is_active && m.current_status === 'up').length
                    : tab === 'down'
                    ? monitors.filter((m) => m.is_active && m.current_status === 'down').length
                    : monitors.filter((m) => !m.is_active).length;
                const isActive = statusFilter === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span>{tab}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                        isActive
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          : 'bg-zinc-200 dark:bg-zinc-700/60 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <svg
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by monitor name or target URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-red-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Monitors List */}
        {filteredMonitors.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">No monitors found</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try clearing your search query or changing active status filters.'
                : 'Click "Create Monitor" above to configure your first HTTP uptime checker.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredMonitors.map((m) => {
              const isExpanded = expandedMonitorId === m.id;
              const isPinging = isPingLoading === m.id;
              const isUp = m.is_active && m.current_status === 'up';
              const isDown = m.is_active && m.current_status === 'down';
              const isPaused = !m.is_active;

              return (
                <div
                  key={m.id}
                  className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all ${
                    isExpanded
                      ? 'border-red-500/50 ring-2 ring-red-500/10 shadow-md'
                      : isDown
                      ? 'border-red-300 dark:border-red-900/60 bg-red-50/10 dark:bg-red-950/10'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs'
                  }`}
                >
                  {/* Card Header & Main Info */}
                  <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Status & Name Column */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Pulsing Status Icon */}
                      <div className="mt-1 flex-shrink-0">
                        {isUp && (
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" title="System Operational" />
                        )}
                        {isDown && (
                          <div className="w-3.5 h-3.5 rounded-full bg-red-500 ring-4 ring-red-500/20 animate-ping" title="Service Incident / Down" />
                        )}
                        {isPaused && (
                          <div className="w-3.5 h-3.5 rounded-full bg-zinc-400 dark:bg-zinc-600" title="Monitor Paused" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {/* HTTP Method Tag */}
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                            {m.method || 'GET'}
                          </span>

                          <span className="font-bold text-base text-zinc-900 dark:text-zinc-50 truncate">
                            {m.name}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`px-2.5 py-0.5 text-xs font-bold rounded-md uppercase tracking-wider ${
                              isUp
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : isDown
                                ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}
                          >
                            {isPaused ? 'Paused' : m.current_status}
                          </span>
                        </div>

                        {/* Target URL */}
                        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate">
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors flex items-center gap-1 truncate"
                          >
                            <span>{m.url}</span>
                            <svg className="w-3 h-3 text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Heartbeat Status Bar */}
                    <div className="flex flex-col gap-1 sm:min-w-[220px]">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-0.5">
                        <span>Check History (16 slots)</span>
                        <span className="font-mono text-zinc-500">{m.uptime_percentage ?? 100}% Uptime</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {(m.status_history || Array(16).fill(m.current_status)).map((st, i) => (
                          <div
                            key={i}
                            className={`h-6 flex-1 rounded-xs transition-colors ${
                              st === 'up'
                                ? 'bg-emerald-500 hover:bg-emerald-400'
                                : st === 'down'
                                ? 'bg-red-500 hover:bg-red-400'
                                : 'bg-zinc-200 dark:bg-zinc-700'
                            }`}
                            title={`Check #${i + 1}: ${st.toUpperCase()}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Metrics & Action Controls */}
                    <div className="flex items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800">
                      {/* Latency & Frequency */}
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                            {m.is_active ? `${m.response_time_ms || 0} ms` : '—'}
                          </div>
                          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Latency</div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Every {m.interval_seconds}s
                          </div>
                          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Frequency</div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2">
                        {/* Test Ping Button */}
                        <button
                          onClick={() => handleTriggerPing(m.id)}
                          disabled={isPinging || !m.is_active}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <svg className={`w-3 h-3 ${isPinging ? 'animate-spin text-red-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>{isPinging ? 'Pinging...' : 'Ping'}</span>
                        </button>

                        {/* Pause / Resume Button */}
                        <button
                          onClick={() => handleToggleActive(m.id)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                            m.is_active
                              ? 'border border-amber-300/80 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80 hover:bg-amber-100'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {m.is_active ? 'Pause' : 'Resume'}
                        </button>

                        {/* Expand Details Trigger */}
                        <button
                          onClick={() => setExpandedMonitorId(isExpanded ? null : m.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isExpanded
                              ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800'
                              : 'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Monitor Drawer */}
                  {isExpanded && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 p-5 rounded-b-2xl">
                      {isDown && m.last_error && (
                        <div className="mb-4 p-3.5 bg-red-100/80 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-800 dark:text-red-300 font-mono">
                          <div className="font-bold mb-0.5 uppercase tracking-wide">Last Error Details</div>
                          <div>{m.last_error}</div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                          <div className="text-zinc-400 text-[10px] uppercase font-semibold">Expected Status</div>
                          <div className="font-mono font-bold mt-0.5 text-zinc-800 dark:text-zinc-200">
                            HTTP {m.expected_status}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                          <div className="text-zinc-400 text-[10px] uppercase font-semibold">Last Checked</div>
                          <div className="font-medium mt-0.5 text-zinc-800 dark:text-zinc-200">
                            {formatTimeAgo(m.last_checked)}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                          <div className="text-zinc-400 text-[10px] uppercase font-semibold">HTTP Method</div>
                          <div className="font-mono font-bold mt-0.5 text-zinc-800 dark:text-zinc-200">
                            {m.method || 'GET'}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                          <div className="text-zinc-400 text-[10px] uppercase font-semibold">Check Interval</div>
                          <div className="font-medium mt-0.5 text-zinc-800 dark:text-zinc-200">
                            Every {m.interval_seconds} seconds
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Monitor Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Create Uptime Monitor</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMonitor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Monitor Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Authentication API Health"
                  value={newMonitorName}
                  onChange={(e) => setNewMonitorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500/50 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Target Endpoint URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://api.yourdomain.com/health"
                  value={newMonitorUrl}
                  onChange={(e) => setNewMonitorUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500/50 focus:outline-hidden font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    HTTP Method
                  </label>
                  <select
                    value={newMonitorMethod}
                    onChange={(e) => setNewMonitorMethod(e.target.value as 'GET' | 'POST' | 'HEAD')}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500/50 focus:outline-hidden"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="HEAD">HEAD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Expected Status Code
                  </label>
                  <input
                    type="number"
                    value={newMonitorExpectedStatus}
                    onChange={(e) => setNewMonitorExpectedStatus(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500/50 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Check Frequency (seconds)
                </label>
                <select
                  value={newMonitorInterval}
                  onChange={(e) => setNewMonitorInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500/50 focus:outline-hidden"
                >
                  <option value={30}>Every 30 seconds</option>
                  <option value={60}>Every 60 seconds</option>
                  <option value={120}>Every 2 minutes</option>
                  <option value={300}>Every 5 minutes</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 mt-5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Save & Start Monitoring
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}