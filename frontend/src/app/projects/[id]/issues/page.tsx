'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Issue } from '@/lib/types';
import { mockIssues } from '@/lib/mockData';

export default function IssuesPage() {
  const { id } = useParams();
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    // TODO: replace with real API call — api.get(`/projects/${id}/issues/`)
    setIssues(mockIssues);
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto mt-12 px-4">
      <Link href="/projects" className="text-sm underline text-gray-500">
        ← Back to Projects
      </Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">Issues</h1>

      {issues.length === 0 && <p className="text-gray-500">No issues yet.</p>}

      <div className="flex flex-col gap-3">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="font-semibold text-gray-900">{issue.title}</div>
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {issue.count}x
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Last seen {new Date(issue.last_seen).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}