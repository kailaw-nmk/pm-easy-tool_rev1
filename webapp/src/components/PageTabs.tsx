import { useState, useCallback, useRef } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { AddScheduleDialog } from './AddScheduleDialog';

interface TabContextMenu {
  x: number;
  y: number;
  pageId: string;
}

export function PageTabs() {
  const { data, currentPageId, setCurrentPage, removePage, renamePage, reorderPage, movePageToIndex } = useScheduleStore();
  const tc = useThemeColors();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [contextMenu, setContextMenu] = useState<TabContextMenu | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Drag state
  const dragRef = useRef<{ pageId: string; startX: number; isDragging: boolean } | null>(null);
  const [dragState, setDragState] = useState<{ draggingPageId: string; dropIndex: number } | null>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

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

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent, pageId: string) => {
    if (e.button !== 0 || renaming) return;
    dragRef.current = { pageId, startX: e.clientX, isDragging: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [renaming]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !data) return;
    const dx = e.clientX - dragRef.current.startX;
    if (!dragRef.current.isDragging && Math.abs(dx) < 3) return;
    dragRef.current.isDragging = true;

    // Calculate drop index based on mouse position relative to tab centers
    const mouseX = e.clientX;
    let dropIndex = 0;
    const pages = data.pages;
    for (let i = 0; i < pages.length; i++) {
      const el = tabRefs.current.get(pages[i].id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      if (mouseX > center) {
        dropIndex = i + 1;
      }
    }
    // Adjust: if dragging page is before dropIndex, the effective insert position shifts
    const dragIndex = pages.findIndex((p) => p.id === dragRef.current!.pageId);
    if (dragIndex < dropIndex) dropIndex = Math.min(dropIndex, pages.length);

    setDragState({ draggingPageId: dragRef.current.pageId, dropIndex });
  }, [data]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const wasDragging = dragRef.current.isDragging;
    const pageId = dragRef.current.pageId;

    if (wasDragging && dragState && data) {
      const dragIndex = data.pages.findIndex((p) => p.id === pageId);
      let targetIndex = dragState.dropIndex;
      // splice logic: if moving forward, subtract 1 for removal shift
      if (dragIndex < targetIndex) targetIndex--;
      if (targetIndex !== dragIndex) {
        movePageToIndex(pageId, targetIndex);
      }
    } else if (!wasDragging) {
      // Normal click — switch page
      setCurrentPage(pageId);
    }

    dragRef.current = null;
    setDragState(null);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }, [dragState, data, movePageToIndex, setCurrentPage]);

  if (!data) return null;

  const canDelete = data.pages.length > 1;
  const contextPageIdx = contextMenu ? data.pages.findIndex((p) => p.id === contextMenu.pageId) : -1;
  const canMoveLeft = contextPageIdx > 0;
  const canMoveRight = contextPageIdx >= 0 && contextPageIdx < data.pages.length - 1;

  // Calculate drop indicator position
  let dropIndicatorLeft: number | null = null;
  if (dragState) {
    const pages = data.pages;
    if (dragState.dropIndex === 0) {
      const firstEl = tabRefs.current.get(pages[0]?.id);
      if (firstEl) {
        const containerRect = firstEl.parentElement?.getBoundingClientRect();
        const tabRect = firstEl.getBoundingClientRect();
        if (containerRect) dropIndicatorLeft = tabRect.left - containerRect.left;
      }
    } else {
      const prevPage = pages[Math.min(dragState.dropIndex - 1, pages.length - 1)];
      const el = tabRefs.current.get(prevPage?.id);
      if (el) {
        const containerRect = el.parentElement?.getBoundingClientRect();
        const tabRect = el.getBoundingClientRect();
        if (containerRect) dropIndicatorLeft = tabRect.right - containerRect.left;
      }
    }
  }

  return (
    <>
      <div className="page-tabs" onClick={() => setContextMenu(null)} style={{ position: 'relative' }}>
        {data.pages.map((page) => (
          <button
            key={page.id}
            ref={(el) => { if (el) tabRefs.current.set(page.id, el); else tabRefs.current.delete(page.id); }}
            className={`${page.id === currentPageId ? 'active' : ''} ${dragState?.draggingPageId === page.id ? 'tab-dragging' : ''}`}
            onPointerDown={(e) => handlePointerDown(e, page.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onContextMenu={(e) => handleContextMenu(e, page.id)}
            style={{ touchAction: 'none' }}
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

        {/* Drop indicator */}
        {dragState && dropIndicatorLeft !== null && (
          <div style={{
            position: 'absolute',
            left: dropIndicatorLeft,
            top: 4,
            bottom: 4,
            width: 2,
            background: tc.accent,
            borderRadius: 1,
            pointerEvents: 'none',
            zIndex: 10,
          }} />
        )}

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
