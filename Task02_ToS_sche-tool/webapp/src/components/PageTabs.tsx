import { useState, useCallback } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { AddScheduleDialog } from './AddScheduleDialog';

interface TabContextMenu {
  x: number;
  y: number;
  pageId: string;
}

export function PageTabs() {
  const { data, currentPageId, setCurrentPage, removePage, renamePage } = useScheduleStore();
  const [showAddDialog, setShowAddDialog] = useState(false);
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

  const handleDelete = useCallback(() => {
    if (!contextMenu) return;
    removePage(contextMenu.pageId);
    setContextMenu(null);
  }, [contextMenu, removePage]);

  if (!data) return null;

  const canDelete = data.pages.length > 1;

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
                  border: '1px solid #1565c0',
                  borderRadius: 2,
                  padding: '2px 4px',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  width: 120,
                  background: '#fff',
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
          <button onClick={handleRename}>名前変更</button>
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
    </>
  );
}
