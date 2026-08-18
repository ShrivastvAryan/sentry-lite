'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Monitor } from '@/lib/types';
import { mockMonitors } from '@/lib/mockData';

const statusStyles: Record<Monitor['current_status'], string> = {
  up: 'bg-green-100 text-green-700',
  down: 'bg-red-100 text-red-700',
  unknown: 'bg-gray-100 text-gray-500',
};


export default function MonitorsPage() {
  const { id } = useParams();
  const [monitors, setMonitors] = useState<Monitor[]>([]);

  useEffect(() => {
    // TODO: replace with real API call — api.get(`/projects/${id}/monitors/`)
    setMonitors(mockMonitors);
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto mt-12 px-4">
      <Link href="/projects" className="text-sm underline text-gray-500">
        ← Back to Projects
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">Monitors</h1>

      {monitors.length === 0 && <p className="text-gray-500">No monitors yet.</p>}

      <div className="flex flex-col gap-3">
        {monitors.map((m) => (
          <div
            key={m.id}
            className="border rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
          >
            <div>
              <div className="font-semibold text-gray-900">{m.name}</div>
              <div className="text-sm text-gray-500">{m.url}</div>
              {!m.is_active && (
                <span className="text-xs text-gray-400 italic">paused</span>
              )}
            </div>
            <span
              className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${statusStyles[m.current_status]}`}
            >
              {m.current_status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}