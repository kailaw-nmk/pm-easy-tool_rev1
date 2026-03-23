import { useRef, useCallback, useState } from 'react';
import { useUIStore } from '../../hooks/useUIStore';
import { MIN_LANE_HEADER_WIDTH, MAX_LANE_HEADER_WIDTH } from '../../lib/constants';

interface Props {
  headerWidth: number;
  totalHeight: number;
}

export function LaneHeaderResizeHandle({ headerWidth, totalHeight }: Props) {
  const setLaneHeaderWidthPx = useUIStore((s) => s.setLaneHeaderWidthPx);
  const dragRef = useRef<{ startX: number; origWidth: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, origWidth: headerWidth };
    setDragging(true);
  }, [headerWidth]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const newWidth = Math.max(MIN_LANE_HEADER_WIDTH, Math.min(MAX_LANE_HEADER_WIDTH, dragRef.current.origWidth + dx));
    setLaneHeaderWidthPx(newWidth);
  }, [setLaneHeaderWidthPx]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        left: headerWidth - 3,
        top: 0,
        width: 6,
        height: totalHeight,
        cursor: 'col-resize',
        pointerEvents: 'auto',
        zIndex: 31,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {dragging && (
        <div
          style={{
            position: 'absolute',
            left: 2,
            top: 0,
            width: 2,
            height: '100%',
            backgroundColor: 'var(--accent-color, #3b82f6)',
            opacity: 0.7,
          }}
        />
      )}
    </div>
  );
}
