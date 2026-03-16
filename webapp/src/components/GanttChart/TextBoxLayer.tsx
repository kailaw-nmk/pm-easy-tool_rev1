import { useCallback, useRef, useState } from 'react';
import type { TextBox, SchedulePage } from '../../types/schedule';
import type { PositionContext } from '../../lib/position';
import { getItemRect } from '../../lib/connection-utils';

interface LaneOffset {
  laneId: string;
  y: number;
}

interface TextBoxLayerProps {
  textBoxes: TextBox[];
  page: SchedulePage;
  laneOffsets: LaneOffset[];
  posCtx: PositionContext;
  selectedTextBoxId: string | null;
  onSelect: (id: string) => void;
  onDoubleClick: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onUpdate: (id: string, updates: Partial<TextBox>) => void;
}

export function TextBoxLayer({
  textBoxes,
  page,
  laneOffsets,
  posCtx,
  selectedTextBoxId,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onUpdate,
}: TextBoxLayerProps) {
  const dragRef = useRef<{
    id: string;
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    origFontSize: number;
  } | null>(null);
  const [dragDelta, setDragDelta] = useState<{ dx: number; dy: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent, tb: TextBox, mode: 'move' | 'resize') => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(tb.id);
    dragRef.current = {
      id: tb.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: tb.x,
      origY: tb.y,
      origW: tb.width,
      origH: tb.height,
      origFontSize: tb.fontSize,
    };
    setDragDelta({ dx: 0, dy: 0 });

    const svg = (e.currentTarget as SVGElement).ownerSVGElement;
    if (!svg) return;

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      // Apply SVG scale correction
      const ctm = svg.getScreenCTM();
      const scaleDx = ctm ? dx / ctm.a : dx;
      const scaleDy = ctm ? dy / ctm.d : dy;
      setDragDelta({ dx: scaleDx, dy: scaleDy });
    };

    const onUp = () => {
      if (dragRef.current) {
        const d = dragRef.current;
        // Read final delta from state is tricky; compute from pointer
        // We'll use the last known values
        setDragDelta((prev) => {
          if (!prev) return null;
          if (d.mode === 'move') {
            onUpdate(d.id, {
              x: Math.round(d.origX + prev.dx),
              y: Math.round(d.origY + prev.dy),
            });
          } else {
            const newW = Math.max(40, Math.round(d.origW + prev.dx));
            const newH = Math.max(20, Math.round(d.origH + prev.dy));
            const scaleX = newW / d.origW;
            const scaleY = newH / d.origH;
            const scale = Math.sqrt(scaleX * scaleY);
            const newFontSize = Math.max(6, Math.min(48, Math.round(d.origFontSize * scale)));
            onUpdate(d.id, {
              width: newW,
              height: newH,
              fontSize: newFontSize,
            });
          }
          return null;
        });
        dragRef.current = null;
      }
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [onSelect, onUpdate]);

  const laneOffsetMap = new Map(laneOffsets.map((lo) => [lo.laneId, lo.y]));

  return (
    <g className="textbox-layer">
      {/* Arrow marker */}
      <defs>
        <marker
          id="textbox-arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
        </marker>
      </defs>

      {textBoxes.map((tb) => {
        const isSelected = tb.id === selectedTextBoxId;
        const isDragging = dragRef.current?.id === tb.id && dragDelta;

        let renderX = tb.x;
        let renderY = tb.y;
        let renderW = tb.width;
        let renderH = tb.height;
        let renderFontSize = tb.fontSize;

        if (isDragging && dragDelta) {
          if (dragRef.current!.mode === 'move') {
            renderX = dragRef.current!.origX + dragDelta.dx;
            renderY = dragRef.current!.origY + dragDelta.dy;
          } else {
            renderW = Math.max(40, dragRef.current!.origW + dragDelta.dx);
            renderH = Math.max(20, dragRef.current!.origH + dragDelta.dy);
            const scaleX = renderW / dragRef.current!.origW;
            const scaleY = renderH / dragRef.current!.origH;
            const scale = Math.sqrt(scaleX * scaleY);
            renderFontSize = Math.max(6, Math.min(48, Math.round(dragRef.current!.origFontSize * scale)));
          }
        }

        // Compute arrow to target item
        let arrowPath: { targetX: number; targetY: number } | null = null;
        if (tb.arrowTargetItemId && tb.arrowTargetLaneId) {
          const lane = page.swimLanes.find((l) => l.id === tb.arrowTargetLaneId);
          const laneY = laneOffsetMap.get(tb.arrowTargetLaneId);
          if (lane && laneY !== undefined) {
            const rect = getItemRect(lane, tb.arrowTargetItemId, laneY, posCtx);
            if (rect) {
              arrowPath = {
                targetX: rect.x + rect.w / 2,
                targetY: rect.y + rect.h / 2,
              };
            }
          }
        }

        const centerX = renderX + renderW / 2;
        const centerY = renderY + renderH / 2;

        return (
          <g key={tb.id}>
            {/* Arrow line */}
            {arrowPath && (
              <line
                x1={centerX}
                y1={centerY}
                x2={arrowPath.targetX}
                y2={arrowPath.targetY}
                stroke={tb.arrowColor ?? '#888888'}
                strokeWidth={tb.arrowStrokeWidth ?? 1.5}
                markerEnd="url(#textbox-arrowhead)"
                style={{ color: tb.arrowColor ?? '#888888' }}
                pointerEvents="none"
              />
            )}

            {/* Box background */}
            <rect
              x={renderX}
              y={renderY}
              width={renderW}
              height={renderH}
              fill={tb.fillColor}
              stroke={isSelected ? '#2563eb' : tb.borderColor}
              strokeWidth={isSelected ? 2 : tb.borderWidth}
              rx={3}
              ry={3}
              style={{ cursor: 'move' }}
              onPointerDown={(e) => handlePointerDown(e, tb, 'move')}
              onClick={(e) => { e.stopPropagation(); onSelect(tb.id); }}
              onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(tb.id); }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, tb.id); }}
            />

            {/* Text */}
            <foreignObject
              x={renderX + 4}
              y={renderY + 2}
              width={renderW - 8}
              height={renderH - 4}
              pointerEvents="none"
            >
              <div
                style={{
                  fontSize: renderFontSize,
                  color: tb.textColor,
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  lineHeight: 1.3,
                  userSelect: 'none',
                }}
              >
                {tb.text}
              </div>
            </foreignObject>

            {/* Resize handle (bottom-right corner) */}
            {isSelected && (
              <rect
                x={renderX + renderW - 8}
                y={renderY + renderH - 8}
                width={8}
                height={8}
                fill="#2563eb"
                style={{ cursor: 'nwse-resize' }}
                onPointerDown={(e) => handlePointerDown(e, tb, 'resize')}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
