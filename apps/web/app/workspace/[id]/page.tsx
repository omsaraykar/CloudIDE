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
      <div className="h-screen w-screen bg-[#0a0d12] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ide-accent to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/10">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-300">Loading CloudIDE workspace layout...</p>
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
      <div className="h-screen w-screen bg-[#0a0d12] flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ide-accent to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/10">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-300">Initializing CloudIDE Workspace...</p>
        <p className="text-xs text-slate-500 mt-1">Mounting virtual filesystem & terminal sessions</p>
      </div>
    );
  }

  return <WorkspaceLayout />;
}
