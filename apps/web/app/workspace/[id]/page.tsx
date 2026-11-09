'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useWorkspaceStore } from '../../../stores/useWorkspaceStore';
import { Loader2 } from 'lucide-react';

const WorkspaceLayout = dynamic(
  () => import('../../../components/layout/WorkspaceLayout').then((m) => m.WorkspaceLayout),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-200">
        <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/[0.1] flex items-center justify-center mb-3 shadow-sm">
          <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
        </div>
        <p className="text-xs font-medium text-zinc-300">Loading CloudIDE workspace...</p>
      </div>
    ),
  }
);

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.id as string;

  const { initWorkspace, leaveWorkspace, isLoadingWorkspace, workspace } = useWorkspaceStore();

  useEffect(() => {
    if (workspaceId) {
      initWorkspace(workspaceId);
    }
    return () => {
      leaveWorkspace();
    };
  }, [workspaceId]);

  if (isLoadingWorkspace && !workspace) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-200">
        <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/[0.1] flex items-center justify-center mb-3 shadow-sm">
          <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
        </div>
        <p className="text-xs font-medium text-zinc-300">Initializing Workspace...</p>
        <p className="text-[11px] text-zinc-500 mt-1 font-mono">Attaching persistent container & bash terminal</p>
      </div>
    );
  }

  return <WorkspaceLayout />;
}
