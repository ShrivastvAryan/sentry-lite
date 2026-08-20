'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Issue } from '@/lib/types';
import { mockIssues } from '@/lib/mockData';

type StatusFilter = 'unhandled' | 'resolved' | 'ignored' | 'all';
type SortOption = 'last_seen' | 'count' | 'users_count' | 'newest';

function formatTimeAgo(dateString: string): string {
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

function getTypeColor(type?: string): { bg: string; text: string; border: string } {
  switch (type) {
    case 'TypeError':
      return { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' };
    case 'ReferenceError':
      return { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' };
    case 'DatabaseError':
      return { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' };
    case 'NetworkError':
      return { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' };
    case 'SyntaxError':
      return { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' };
    default:
      return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-700 dark:text-zinc-300', border: 'border-zinc-200 dark:border-zinc-700' };
  }
}

export default function IssuesPage() {
  const { id } = useParams();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unhandled');
  const [envFilter, setEnvFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('last_seen');
  const [expandedIssueId, setExpandedIssueId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [copiedFingerprint, setCopiedFingerprint] = useState<string | null>(null);

  useEffect(() => {
    // TODO: replace with real API call — api.get(`/projects/${id}/issues/`)
    setIssues(mockIssues);
  }, [id]);

  // Aggregate KPI stats
  const kpiStats = useMemo(() => {
    const totalCount = issues.reduce((sum, item) => sum + item.count, 0);
    const totalUsers = issues.reduce((sum, item) => sum + (item.users_count || 1), 0);
    const unhandledCount = issues.filter((item) => (item.status || 'unhandled') === 'unhandled').length;

    return {
      totalIssues: issues.length,
      totalEvents: totalCount,
      totalUsers: totalUsers,
      unhandledIssues: unhandledCount,
    };
  }, [issues]);

  // Filtered and sorted issues
  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        // Status filter
        const currentStatus = issue.status || 'unhandled';
        if (statusFilter !== 'all' && currentStatus !== statusFilter) {
          return false;
        }

        // Environment filter
        if (envFilter !== 'all' && issue.environment !== envFilter) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const titleMatch = issue.title.toLowerCase().includes(q);
          const culpritMatch = (issue.culprit || '').toLowerCase().includes(q);
          const typeMatch = (issue.type || '').toLowerCase().includes(q);
          const fingerprintMatch = issue.fingerprint.toLowerCase().includes(q);
          const messageMatch = (issue.message || '').toLowerCase().includes(q);

          return titleMatch || culpritMatch || typeMatch || fingerprintMatch || messageMatch;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'last_seen') {
          return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime();
        }
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'count') {
          return b.count - a.count;
        }
        if (sortBy === 'users_count') {
          return (b.users_count || 1) - (a.users_count || 1);
        }
        return 0;
      });
  }, [issues, statusFilter, envFilter, searchQuery, sortBy]);

  // Handle single issue status change
  const handleUpdateStatus = (issueId: number, newStatus: 'unhandled' | 'resolved' | 'ignored') => {
    setIssues((prev) =>
      prev.map((item) => (item.id === issueId ? { ...item, status: newStatus } : item))
    );
  };

  // Bulk actions
  const handleBulkStatusChange = (newStatus: 'unhandled' | 'resolved' | 'ignored') => {
    setIssues((prev) =>
      prev.map((item) => (selectedIds.includes(item.id) ? { ...item, status: newStatus } : item))
    );
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredIssues.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredIssues.map((item) => item.id));
    }
  };

  const toggleSelectIssue = (issueId: number) => {
    setSelectedIds((prev) =>
      prev.includes(issueId) ? prev.filter((i) => i !== issueId) : [...prev, issueId]
    );
  };

  const handleCopyFingerprint = (fp: string) => {
    navigator.clipboard.writeText(fp);
    setCopiedFingerprint(fp);
    setTimeout(() => setCopiedFingerprint(null), 2000);
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
                <span className="text-zinc-900 dark:text-zinc-100 font-medium">Issues</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">Issues Dashboard</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300">
                  {kpiStats.unhandledIssues} Unhandled
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIssues([...mockIssues])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-xs"
              >
                <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </button>
            </div>
          </div>

          {/* Stats KPI Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Issues</div>
              <div className="text-xl font-bold mt-1 text-zinc-900 dark:text-zinc-50">{kpiStats.totalIssues}</div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Events</div>
              <div className="text-xl font-bold mt-1 text-red-600 dark:text-red-400">{kpiStats.totalEvents.toLocaleString()}</div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Users Impacted</div>
              <div className="text-xl font-bold mt-1 text-purple-600 dark:text-purple-400">{kpiStats.totalUsers}</div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Unhandled</div>
              <div className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">{kpiStats.unhandledIssues}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Toolbar & Filters */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-xs mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-fit">
              {(['unhandled', 'resolved', 'ignored', 'all'] as StatusFilter[]).map((tab) => {
                const count =
                  tab === 'all'
                    ? issues.length
                    : issues.filter((i) => (i.status || 'unhandled') === tab).length;
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

            {/* Search Input & Select Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
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
                  placeholder="Filter issues by title, culprit file, type..."
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

              {/* Environment Filter */}
              <select
                value={envFilter}
                onChange={(e) => setEnvFilter(e.target.value)}
                className="py-1.5 px-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-red-500/50"
              >
                <option value="all">All Environments</option>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="py-1.5 px-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-red-500/50"
              >
                <option value="last_seen">Sort by Last Seen</option>
                <option value="count">Sort by Event Count</option>
                <option value="users_count">Sort by Users Impacted</option>
                <option value="newest">Sort by Newest</option>
              </select>
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {selectedIds.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-red-50/50 dark:bg-red-950/20 px-3 py-2 rounded-xl">
              <span className="text-xs font-medium text-red-700 dark:text-red-300">
                {selectedIds.length} {selectedIds.length === 1 ? 'issue' : 'issues'} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkStatusChange('resolved')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => handleBulkStatusChange('ignored')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-600 hover:bg-zinc-700 text-white transition-colors"
                >
                  Mark Ignored
                </button>
                <button
                  onClick={() => handleBulkStatusChange('unhandled')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 transition-colors"
                >
                  Mark Unhandled
                </button>
              </div>
            </div>
          )}
        </div>

        {/* List Header Controls */}
        <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={filteredIssues.length > 0 && selectedIds.length === filteredIssues.length}
              onChange={toggleSelectAll}
              className="rounded border-zinc-300 dark:border-zinc-700 text-red-600 focus:ring-red-500/30"
            />
            <span>Issue Details & Culprit Location</span>
          </div>
          <div className="flex items-center gap-8">
            <span className="hidden sm:inline">Events / Users</span>
            <span>Last Seen</span>
          </div>
        </div>

        {/* Issues List Container */}
        {filteredIssues.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">No issues found</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || envFilter !== 'all'
                ? 'Try adjusting your search criteria or clearing filters to view all recorded exceptions.'
                : 'Great job! Your project currently has no recorded error issues.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredIssues.map((issue) => {
              const isSelected = selectedIds.includes(issue.id);
              const isExpanded = expandedIssueId === issue.id;
              const typeStyle = getTypeColor(issue.type);
              const issueStatus = issue.status || 'unhandled';

              return (
                <div
                  key={issue.id}
                  className={`bg-white dark:bg-zinc-900 rounded-2xl border transition-all ${
                    isExpanded
                      ? 'border-red-500/50 ring-2 ring-red-500/10 shadow-md'
                      : isSelected
                      ? 'border-red-400/40 bg-red-50/10 dark:bg-red-950/10'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs'
                  }`}
                >
                  {/* Issue Main Summary Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectIssue(issue.id)}
                        className="mt-1 rounded border-zinc-300 dark:border-zinc-700 text-red-600 focus:ring-red-500/30"
                      />

                      {/* Error Type Badge & Main Information */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {/* Severity / Type Badge */}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                          >
                            {issue.type || 'Error'}
                          </span>

                          {/* Status Pill */}
                          <span
                            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md uppercase tracking-wider ${
                              issueStatus === 'unhandled'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                                : issueStatus === 'resolved'
                                ? 'bg-green-100 text-green-700 dark:bg-green-950/80 dark:text-green-300'
                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}
                          >
                            {issueStatus}
                          </span>

                          {/* Environment Pill */}
                          {issue.environment && (
                            <span className="px-2 py-0.5 text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md">
                              {issue.environment}
                            </span>
                          )}
                        </div>

                        {/* Title - What is the issue */}
                        <div
                          onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                          className="font-bold text-base text-zinc-900 dark:text-zinc-50 hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors break-words"
                        >
                          {issue.title}
                        </div>

                        {/* Message Preview */}
                        {issue.message && issue.message !== issue.title && (
                          <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-1">
                            {issue.message}
                          </div>
                        )}

                        {/* Culprit File Location */}
                        {issue.culprit ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-2 bg-zinc-50 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg w-fit border border-zinc-200/80 dark:border-zinc-700/60">
                            <svg className="w-3.5 h-3.5 text-red-500/80 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            <span className="truncate">{issue.culprit}</span>
                          </div>
                        ) : (
                          <div className="text-xs font-mono text-zinc-400 mt-1">Fingerprint: #{issue.fingerprint}</div>
                        )}
                      </div>
                    </div>

                    {/* Metrics and Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                      {/* Event Count & User Count */}
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                            {issue.count.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Events</div>
                        </div>

                        <div>
                          <div className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono">
                            {issue.users_count || 1}
                          </div>
                          <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Users</div>
                        </div>
                      </div>

                      {/* Last Seen & Details Button */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            {formatTimeAgo(issue.last_seen)}
                          </div>
                          <div className="text-[10px] text-zinc-400" title={new Date(issue.last_seen).toLocaleString()}>
                            {new Date(issue.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        {/* Expand Details Trigger */}
                        <button
                          onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isExpanded
                              ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800'
                              : 'bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                          }`}
                          title="Toggle inline details and stack trace"
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

                  {/* Expanded Detail Drawer */}
                  {isExpanded && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 p-5 rounded-b-2xl">
                      {/* Actions Bar inside details */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Quick Status:</span>
                          <button
                            onClick={() => handleUpdateStatus(issue.id, 'resolved')}
                            disabled={issueStatus === 'resolved'}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                              issueStatus === 'resolved'
                                ? 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            ✓ Resolve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(issue.id, 'ignored')}
                            disabled={issueStatus === 'ignored'}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                              issueStatus === 'ignored'
                                ? 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'
                                : 'bg-zinc-700 hover:bg-zinc-800 text-white'
                            }`}
                          >
                            Ignore
                          </button>
                          {issueStatus !== 'unhandled' && (
                            <button
                              onClick={() => handleUpdateStatus(issue.id, 'unhandled')}
                              className="px-3 py-1 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 text-zinc-700 dark:text-zinc-300 transition-colors"
                            >
                              Reopen
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyFingerprint(issue.fingerprint)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 transition-colors"
                          >
                            <span>#{issue.fingerprint}</span>
                            <span className="text-[10px] text-zinc-400">
                              {copiedFingerprint === issue.fingerprint ? '✓ Copied' : 'Copy'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Stack Trace Preview */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide uppercase">
                            Stack Trace Exception Breakdown
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">Culprit: {issue.culprit || 'N/A'}</span>
                        </div>

                        <div className="bg-zinc-900 text-zinc-100 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner border border-zinc-800 leading-relaxed">
                          {issue.stack_trace && issue.stack_trace.length > 0 ? (
                            issue.stack_trace.map((line, idx) => (
                              <div
                                key={idx}
                                className={`py-0.5 ${
                                  idx === 0
                                    ? 'text-red-400 font-bold'
                                    : line.includes('src/') || line.includes('backend/')
                                    ? 'text-amber-300 font-semibold bg-zinc-800/60 px-1 rounded-sm'
                                    : 'text-zinc-400'
                                }`}
                              >
                                {line}
                              </div>
                            ))
                          ) : (
                            <div className="text-zinc-500 italic">No stack trace frames recorded for this issue.</div>
                          )}
                        </div>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                          <div className="text-zinc-400 text-[10px] uppercase font-semibold">First Seen</div>
                          <div className="font-medium mt-0.5 text-zinc-700 dark:text-zinc-300">
                            {new Date(issue.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                          <div className="text-zinc-400 text-[10px] uppercase font-semibold">Environment</div>
                          <div className="font-medium mt-0.5 text-zinc-700 dark:text-zinc-300 capitalize">
                            {issue.environment || 'production'}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                          <div className="text-zinc-400 text-[10px] uppercase font-semibold">Handled</div>
                          <div className="font-medium mt-0.5 text-zinc-700 dark:text-zinc-300">
                            {issue.handled ? 'Yes (Caught)' : 'No (Unhandled Exception)'}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                          <div className="text-zinc-400 text-[10px] uppercase font-semibold">Fingerprint Hash</div>
                          <div className="font-mono mt-0.5 text-zinc-700 dark:text-zinc-300 truncate">
                            {issue.fingerprint}
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
    </div>
  );
}