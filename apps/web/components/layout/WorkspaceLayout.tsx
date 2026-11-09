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

  return (
    <div className="h-screen w-screen flex flex-col bg-ide-bg text-ide-text overflow-hidden select-none">
      {/* Top Navbar */}
      <TopBar />

      {/* Main Resizable Body */}
      <div className="flex-1 w-full overflow-hidden relative">
        <PanelGroup direction="horizontal" autoSaveId="cloudide-horizontal-panels">
          {/* Left Sidebar (File Explorer) */}
          {isSidebarOpen && (
            <>
              <Panel defaultSize={20} minSize={14} maxSize={40} className="h-full">
                <FileExplorer />
              </Panel>
              <PanelResizeHandle className="w-[3px] bg-ide-border hover:bg-ide-accent transition-colors cursor-col-resize active:bg-ide-accent" />
            </>
          )}

          {/* Center/Main Area: Editor + Bottom Panel */}
          <Panel className="h-full flex flex-col">
            <PanelGroup direction="vertical" autoSaveId="cloudide-vertical-panels">
              {/* Monaco Editor Pane */}
              {!isBottomMaximized && (
                <Panel defaultSize={68} minSize={25} className="flex flex-col h-full">
                  <EditorTabs />
                  <div className="flex-1 w-full overflow-hidden relative">
                    {isPreviewOpen ? (
                      <PanelGroup direction="horizontal" autoSaveId="cloudide-editor-preview-panels">
                        <Panel defaultSize={50} minSize={20} className="h-full">
                          <CodeEditor />
                        </Panel>
                        <PanelResizeHandle className="w-[3px] bg-ide-border hover:bg-sky-500/50 transition-colors cursor-col-resize active:bg-sky-500" />
                        <Panel defaultSize={50} minSize={25} className="h-full">
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
                <PanelResizeHandle className="h-[3px] bg-ide-border hover:bg-ide-accent transition-colors cursor-row-resize active:bg-ide-accent" />
              )}

              {/* Bottom Integrated Terminal & Output Panel */}
              {isBottomPanelOpen && (
                <Panel
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
