'use client';

import React, { useState } from 'react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';
import { TopBar } from '../topbar/TopBar';
import { FileExplorer } from '../explorer/FileExplorer';
import { EditorTabs } from '../editor/EditorTabs';
import { CodeEditor } from '../editor/CodeEditor';
import { BrowserPreview } from '../preview/BrowserPreview';
import { BottomPanel } from '../bottom-panel/BottomPanel';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

export function WorkspaceLayout() {
  const { isSidebarOpen, isBottomPanelOpen, isPreviewOpen } = useWorkspaceStore();
  const [isBottomMaximized, setIsBottomMaximized] = useState(false);

  React.useEffect(() => {
    // Clear any corrupted or inverted legacy panel state from localStorage
    try {
      localStorage.removeItem('cloudide-vertical-panels');
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-ide-bg text-ide-text overflow-hidden select-none">
      {/* Top Navbar */}
      <TopBar />

      {/* Main Resizable Body */}
      <div className="flex-1 w-full overflow-hidden relative">
        <PanelGroup direction="horizontal" autoSaveId="cloudide-horizontal-panels-v3">
          {/* Left Sidebar (File Explorer) */}
          {isSidebarOpen && (
            <>
              <Panel id="sidebar-panel" order={1} defaultSize={20} minSize={14} maxSize={40} className="h-full">
                <FileExplorer />
              </Panel>
              <PanelResizeHandle
                id="sidebar-resize-handle"
                className="relative w-[1px] bg-white/[0.08] hover:bg-sky-500/80 transition-colors cursor-col-resize active:bg-sky-500 after:absolute after:inset-y-0 after:-left-1.5 after:-right-1.5 after:z-30 after:cursor-col-resize"
              />
            </>
          )}

          {/* Center/Main Area: Editor + Bottom Panel */}
          <Panel id="center-main-panel" order={2} className="h-full flex flex-col">
            <PanelGroup direction="vertical" autoSaveId="cloudide-vertical-layout-v3">
              {/* Monaco Editor Pane */}
              {!isBottomMaximized && (
                <Panel id="editor-pane" order={1} defaultSize={68} minSize={25} className="flex flex-col h-full">
                  <EditorTabs />
                  <div className="flex-1 w-full overflow-hidden relative">
                    {isPreviewOpen ? (
                      <PanelGroup direction="horizontal" autoSaveId="cloudide-editor-preview-panels-v3">
                        <Panel id="editor-left-pane" order={1} defaultSize={50} minSize={20} className="h-full">
                          <CodeEditor />
                        </Panel>
                        <PanelResizeHandle
                          id="preview-resize-handle"
                          className="relative w-[1px] bg-white/[0.08] hover:bg-sky-500/80 transition-colors cursor-col-resize active:bg-sky-500 after:absolute after:inset-y-0 after:-left-1.5 after:-right-1.5 after:z-30 after:cursor-col-resize"
                        />
                        <Panel id="preview-right-pane" order={2} defaultSize={50} minSize={25} className="h-full">
                          <BrowserPreview />
                        </Panel>
                      </PanelGroup>
                    ) : (
                      <CodeEditor />
                    )}
                  </div>
                </Panel>
              )}

              {/* Resize Handle for Bottom Panel */}
              {isBottomPanelOpen && !isBottomMaximized && (
                <PanelResizeHandle
                  id="terminal-resize-handle"
                  className="relative h-[2px] w-full bg-white/[0.08] hover:bg-sky-500/80 transition-colors cursor-row-resize active:bg-sky-500 after:absolute after:inset-x-0 after:-top-2 after:-bottom-2 after:z-30 after:cursor-row-resize"
                />
              )}

              {/* Bottom Integrated Terminal & Output Panel */}
              {isBottomPanelOpen && (
                <Panel
                  id="terminal-pane"
                  order={2}
                  defaultSize={isBottomMaximized ? 100 : 32}
                  minSize={15}
                  maxSize={90}
                  className="h-full flex flex-col"
                >
                  <BottomPanel
                    isMaximized={isBottomMaximized}
                    onToggleMaximize={() => setIsBottomMaximized(!isBottomMaximized)}
                  />
                </Panel>
              )}
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
