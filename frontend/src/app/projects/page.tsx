'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockProjects } from '@/lib/mockData';
import { Project } from '@/lib/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPlatform, setNewProjectPlatform] = useState('Next.js / React');

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;

    const newProj: Project = {
      id: Date.now(),
      name: newProjectName,
      platform: newProjectPlatform,
      api_key: `sntry_live_${Math.random().toString(36).substring(2, 18)}`,
      created_at: new Date().toISOString(),
      issues_count: 0,
      monitors_count: 0,
    };

    setProjects((prev) => [newProj, ...prev]);
    setNewProjectName('');
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans pb-16">
      {/* Navigation Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-xs">
                S
              </div>
              <span className="font-bold text-lg">Sentry<span className="text-red-600">Lite</span></span>
            </Link>
            <span className="text-zinc-400">/</span>
            <span className="font-semibold text-sm">Projects</span>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm"
          >
            + Create New Project
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Your Monitored Projects</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your web, backend, and mobile application error tracking channels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  {p.platform || 'General'}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">#{p.api_key.slice(-6)}</span>
              </div>

              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {p.name}
              </h3>

              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                <div>
                  <div className="text-zinc-400 text-[10px] uppercase font-semibold">Active Issues</div>
                  <div className="text-sm font-bold text-red-600 dark:text-red-400 font-mono mt-0.5">
                    {p.issues_count ?? 0}
                  </div>
                </div>

                <div>
                  <div className="text-zinc-400 text-[10px] uppercase font-semibold">HTTP Monitors</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {p.monitors_count ?? 0}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <Link
                  href={`/projects/${p.id}/issues`}
                  className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100 transition-colors"
                >
                  Issues
                </Link>
                <Link
                  href={`/projects/${p.id}/monitors`}
                  className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 transition-colors"
                >
                  Monitors
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
              <h3 className="text-lg font-bold">Create New Project</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. E-Commerce Backend Service"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Platform Tech Stack</label>
                <select
                  value={newProjectPlatform}
                  onChange={(e) => setNewProjectPlatform(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                >
                  <option value="Next.js / React">Next.js / React</option>
                  <option value="Node.js / Express">Node.js / Express</option>
                  <option value="Go / Microservices">Go / Microservices</option>
                  <option value="Python / Django">Python / Django</option>
                  <option value="React Native">React Native</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 mt-5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
