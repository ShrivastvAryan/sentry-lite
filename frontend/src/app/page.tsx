'use client';

import { useState } from 'react';
import Link from 'next/link';
import { mockProjects } from '@/lib/mockData';

export default function Home() {
  const [selectedFramework, setSelectedFramework] = useState<'nextjs' | 'node' | 'python' | 'go'>('nextjs');
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [testErrorTriggered, setTestErrorTriggered] = useState(false);

  const sdkSnippets = {
    nextjs: `// 1. Install SDK\nnpm install @sentry-lite/nextjs\n\n// 2. Initialize in your app layout or middleware\nimport { initSentryLite } from '@sentry-lite/nextjs';\n\ninitSentryLite({\n  dsn: "https://sntry_live_9f8a7b6c5d4e3f2a@sentry-lite.dev/1",\n  environment: "production",\n});`,
    node: `// 1. Install SDK\nnpm install @sentry-lite/node\n\n// 2. Wrap your express app\nconst SentryLite = require('@sentry-lite/node');\nSentryLite.init({ dsn: "https://sntry_live_9f8a7b6c5d4e3f2a@sentry-lite.dev/1" });\n\napp.use(SentryLite.Handlers.errorHandler());`,
    python: `# 1. Install package\npip install sentry-lite-sdk\n\n# 2. Initialize in main.py\nimport sentry_lite\n\nsentry_lite.init(\n    dsn="https://sntry_live_9f8a7b6c5d4e3f2a@sentry-lite.dev/1",\n    environment="production"\n)`,
    go: `// 1. Go get package\ngo get github.com/sentry-lite/sentry-lite-go\n\n// 2. Initialize in main.go\nimport "github.com/sentry-lite/sentry-lite-go"\n\nsentrylite.Init(sentrylite.ClientOptions{\n    Dsn: "https://sntry_live_9f8a7b6c5d4e3f2a@sentry-lite.dev/1",\n})`,
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(sdkSnippets[selectedFramework]);
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  const handleTriggerTestError = () => {
    setTestErrorTriggered(true);
    setTimeout(() => setTestErrorTriggered(false), 3500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-red-500 selection:text-white">
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 pointer-events-none opacity-25 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600 rounded-full filter blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px]" />
      </div>

      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Sentry<span className="text-red-500 font-extrabold">Lite</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
            <a href="#onboarding" className="hover:text-zinc-100 transition-colors">Onboarding Guide</a>
            <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
            <a href="#projects" className="hover:text-zinc-100 transition-colors">Projects</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/projects/1/issues"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/20"
            >
              Go to Dashboard →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold mb-6 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Production Error & Uptime Telemetry Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight text-white">
          Catch exceptions in production before your <span className="bg-gradient-to-r from-red-500 via-amber-400 to-red-400 bg-clip-text text-transparent">users notice</span>.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          SentryLite combines real-time exception tracking, culprit file stack trace parsing, and HTTP heartbeat uptime monitoring in a simple developer-first interface.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/projects/1/issues"
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-xl shadow-red-600/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Explore Issues Dashboard</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <a
            href="#onboarding"
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 transition-all"
          >
            Quick 2-Min Setup Guide
          </a>
        </div>

        {/* Live Preview Interactive Mock Widget */}
        <div className="mt-14 max-w-4xl mx-auto bg-zinc-900/90 rounded-2xl border border-zinc-800 shadow-2xl p-6 text-left relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-zinc-400 ml-2">live-telemetry.sentry-lite.internal</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Listening for events...
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Live Error Toast Sample */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-red-500/30">
              <div className="flex items-center justify-between text-xs text-red-400 font-bold mb-1">
                <span>TypeError (Unhandled)</span>
                <span>Just now</span>
              </div>
              <div className="font-mono text-xs font-bold text-zinc-100">
                Cannot read properties of undefined (reading &apos;user&apos;)
              </div>
              <div className="text-[11px] font-mono text-zinc-400 mt-2 bg-zinc-900 px-2 py-1 rounded">
                src/components/UserProfile.tsx:42 in renderHeader
              </div>
            </div>

            {/* Live Uptime Heartbeat Sample */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-emerald-500/30">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-1">
                <span>API Health Check</span>
                <span>99.98% Uptime</span>
              </div>
              <div className="text-xs font-mono text-zinc-300">
                https://api.example.com/v1/health (142ms)
              </div>
              <div className="flex items-center gap-1 mt-3">
                {Array(14).fill('up').map((_, i) => (
                  <div key={i} className="h-4 flex-1 rounded-xs bg-emerald-500" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Onboarding Workflow Section */}
      <section id="onboarding" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-800/60">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Get started in 3 simple steps
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Set up exception monitoring and endpoint health checks in under 2 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Step 1 */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 relative">
            <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold text-sm mb-4">
              1
            </div>
            <h3 className="text-base font-bold text-zinc-100">Create a Project</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Select your framework stack to generate a unique API Key DSN for exception capturing.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 relative">
            <div className="w-8 h-8 rounded-full bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm mb-4">
              2
            </div>
            <h3 className="text-base font-bold text-zinc-100">Install the SDK</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Copy the single-line initialization code into your application startup file.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm mb-4">
              3
            </div>
            <h3 className="text-base font-bold text-zinc-100">Test & Monitor</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Send a test exception or configure your first HTTP uptime heartbeat check.
            </p>
          </div>
        </div>

        {/* Interactive Framework Selector & SDK Snippet */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800 mb-4">
            <div className="text-sm font-bold text-zinc-100">
              Select Your Tech Stack SDK:
            </div>
            <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl">
              {(['nextjs', 'node', 'python', 'go'] as const).map((fw) => (
                <button
                  key={fw}
                  onClick={() => setSelectedFramework(fw)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    selectedFramework === fw
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {fw === 'nextjs' ? 'Next.js' : fw === 'node' ? 'Node.js' : fw}
                </button>
              ))}
            </div>
          </div>

          {/* Code Box */}
          <div className="relative">
            <pre className="bg-zinc-950 text-zinc-200 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-zinc-800 leading-relaxed">
              {sdkSnippets[selectedFramework]}
            </pre>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleCopySnippet}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>{copiedApiKey ? '✓ Copied SDK Code!' : 'Copy Code Snippet'}</span>
              </button>

              <button
                onClick={handleTriggerTestError}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Send Test Exception</span>
              </button>
            </div>

            {/* Test Error Event Toast Simulation */}
            {testErrorTriggered && (
              <div className="mt-4 p-4 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold">Test Exception Captured!</span>
                  <span className="text-emerald-400/80 font-mono">TypeError: Test event recorded successfully</span>
                </div>
                <Link
                  href="/projects/1/issues"
                  className="underline font-bold text-white hover:text-emerald-200"
                >
                  View in Issues →
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Existing Projects Quick Launcher Section */}
      <section id="projects" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Active Monitored Projects</h2>
            <p className="text-xs text-zinc-400 mt-1">Select a project to view its real-time exception logs and HTTP monitors.</p>
          </div>

          <Link
            href="/projects/1/issues"
            className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
          >
            <span>View All Projects</span>
            <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockProjects.map((p) => (
            <div
              key={p.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 transition-all hover:shadow-xl group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {p.platform || 'JavaScript'}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">#{p.api_key.slice(-6)}</span>
              </div>

              <h3 className="text-lg font-bold text-zinc-100 group-hover:text-red-400 transition-colors">
                {p.name}
              </h3>

              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-zinc-800 text-xs">
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase font-semibold">Issues</div>
                  <div className="text-sm font-bold text-red-400 font-mono mt-0.5">{p.issues_count ?? 3} Active</div>
                </div>

                <div>
                  <div className="text-zinc-500 text-[10px] uppercase font-semibold">Monitors</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{p.monitors_count ?? 2} Online</div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <Link
                  href={`/projects/${p.id}/issues`}
                  className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                >
                  Issues
                </Link>
                <Link
                  href={`/projects/${p.id}/monitors`}
                  className="flex-1 py-2 text-center text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                >
                  Monitors
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">SentryLite</span>
            <span>— Lightweight Exception & Uptime Monitoring</span>
          </div>
          <div>Built with Next.js 16, React 19 & Tailwind CSS</div>
        </div>
      </footer>
    </div>
  );
}

