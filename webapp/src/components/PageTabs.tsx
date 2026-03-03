import { useState, useCallback } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { AddScheduleDialog } from './AddScheduleDialog';
import { ManageLanesDialog } from './ManageLanesDialog';

interface TabContextMenu {
  x: number;
  y: number;
  pageId: string;
}

export function PageTabs() {
  const { data, currentPageId, setCurrentPage, removePage, renamePage, reorderPage } = useScheduleStore();
  const tc = useThemeColors();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [manageLanesPageId, setManageLanesPageId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<TabContextMenu | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleContextMenu = useCallback((e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, pageId });
  }, []);

  const handleRename = useCallback(() => {
    if (!contextMenu) return;
    const page = data?.pages.find((p) => p.id === contextMenu.pageId);
    setRenaming(contextMenu.pageId);
    setRenameValue(page?.name ?? '');
    setContextMenu(null);
  }, [contextMenu, data]);

  const handleRenameSubmit = useCallback(() => {
    if (renaming && renameValue.trim()) {
      renamePage(renaming, renameValue.trim());
    }
    setRenaming(null);
  }, [renaming, renameValue, renamePage]);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setRenaming(null);
    }
  }, [handleRenameSubmit]);

  const handleMoveLeft = useCallback(() => {
    if (!contextMenu) return;
    reorderPage(contextMenu.pageId, 'left');
    setContextMenu(null);
  }, [contextMenu, reorderPage]);

  const handleMoveRight = useCallback(() => {
    if (!contextMenu) return;
    reorderPage(contextMenu.pageId, 'right');
    setContextMenu(null);
  }, [contextMenu, reorderPage]);

  const handleDelete = useCallback(() => {
    if (!contextMenu) return;
    removePage(contextMenu.pageId);
    setContextMenu(null);
  }, [contextMenu, removePage]);

  if (!data) return null;

  const canDelete = data.pages.length > 1;
  const contextPageIdx = contextMenu ? data.pages.findIndex((p) => p.id === contextMenu.pageId) : -1;
  const canMoveLeft = contextPageIdx > 0;
  const canMoveRight = contextPageIdx >= 0 && contextPageIdx < data.pages.length - 1;

  return (
    <>
      <div className="page-tabs" onClick={() => setContextMenu(null)}>
        {data.pages.map((page) => (
          <button
            key={page.id}
            className={page.id === currentPageId ? 'active' : ''}
            onClick={() => setCurrentPage(page.id)}
            onContextMenu={(e) => handleContextMenu(e, page.id)}
          >
            {renaming === page.id ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={handleRenameKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                style={{
                  border: `1px solid ${tc.accent}`,
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  width: 120,
                  background: tc.inputBg,
                  color: tc.textPrimary,
                }}
              />
            ) : (
              page.name
            )}
          </button>
        ))}
        <button
          className="page-tab-add"
          onClick={() => setShowAddDialog(true)}
          title="新規スケジュール追加"
        >
          +
        </button>
      </div>

      {/* Tab context menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button onClick={handleMoveLeft} disabled={!canMoveLeft}>左に移動</button>
          <button onClick={handleMoveRight} disabled={!canMoveRight}>右に移動</button>
          <button onClick={handleRename}>名前変更</button>
          <button onClick={() => { setManageLanesPageId(contextMenu.pageId); setContextMenu(null); }}>レーン管理...</button>
          <button
            className="danger"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            削除
          </button>
        </div>
      )}

      {/* Add schedule dialog */}
      {showAddDialog && (
        <AddScheduleDialog onClose={() => setShowAddDialog(false)} />
      )}

      {/* Manage lanes dialog */}
      {manageLanesPageId && (
        <ManageLanesDialog
          pageId={manageLanesPageId}
          onClose={() => setManageLanesPageId(null)}
        />
      )}
    </>
  );
}
