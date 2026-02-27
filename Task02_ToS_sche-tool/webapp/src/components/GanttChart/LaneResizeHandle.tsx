import { useRef, useCallback } from 'react';
import { useScheduleStore } from '../../hooks/useScheduleStore';

interface Props {
  pageId: string;
  laneId: string;
  y: number;
  totalWidth: number;
  currentHeight: number;
}

export function LaneResizeHandle({ pageId, laneId, y, totalWidth, currentHeight }: Props) {
  const updateLaneHeight = useScheduleStore((s) => s.updateLaneHeight);
  const dragRef = useRef<{ startY: number; origHeight: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, origHeight: currentHeight };
  }, [currentHeight]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dy = e.clientY - dragRef.current.startY;
    const newHeight = Math.max(40, dragRef.current.origHeight + dy);
    updateLaneHeight(pageId, laneId, newHeight);
  }, [pageId, laneId, updateLaneHeight]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <rect
      x={0}
      y={y - 3}
      width={totalWidth}
      height={6}
      fill="transparent"
      style={{ cursor: 'ns-resize' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}
