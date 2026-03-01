import { useRef, useCallback } from 'react';
import type { SwimLane as SwimLaneType, PageTimeline, ZoomLevel } from '../../types/schedule';
import { ScheduleBarComponent } from './ScheduleBar';
import { MilestoneComponent } from './Milestone';
import { LaneResizeHandle } from './LaneResizeHandle';
import { useUIStore } from '../../hooks/useUIStore';
import { useThemeColors } from '../../hooks/useThemeColors';

interface Props {
  lane: SwimLaneType;
  pageId: string;
  yOffset: number;
  timeline: PageTimeline;
  headerWidth: number;
  totalWidth: number;
  zoomLevel: ZoomLevel;
  fontScale?: number;
  selectedIds?: Set<string>;
  showMemos?: boolean;
  onBarDoubleClick: (barId: string, laneId: string) => void;
  onMilestoneDoubleClick: (msId: string, laneId: string) => void;
  onContextMenu: (e: React.MouseEvent, type: 'bar' | 'milestone', id: string, laneId: string) => void;
  onItemClick?: (e: React.MouseEvent, type: 'bar' | 'milestone', id: string, laneId: string) => void;
  onLaneContextMenu?: (e: React.MouseEvent, laneId: string) => void;
  onLaneClick?: (e: React.MouseEvent, laneId: string) => void;
  onLaneDragStart?: (laneId: string, startY: number, laneHeight: number) => void;
  isLaneSelected?: boolean;
  onTooltipShow?: (text: string, x: number, y: number) => void;
  onTooltipHide?: () => void;
}

export function SwimLaneComponent({
  lane, pageId, yOffset, timeline, headerWidth, totalWidth, zoomLevel, fontScale = 1.0,
  selectedIds, showMemos,
  onBarDoubleClick, onMilestoneDoubleClick, onContextMenu, onItemClick,
  onLaneContextMenu, onLaneClick, onLaneDragStart, isLaneSelected, onTooltipShow, onTooltipHide,
}: Props) {
  const baseFontSizeLaneTitle = useUIStore((s) => s.fontSizeLaneTitle);
  const fontSizeLaneTitle = baseFontSizeLaneTitle * fontScale;
  const tc = useThemeColors();
  const labelLines = lane.label.split('\n');

  const laneDragRef = useRef<{ startY: number; hasMoved: boolean } | null>(null);
  const DRAG_THRESHOLD = 3;

  const handleLanePointerDown = useCallback((e: React.PointerEvent) => {
    laneDragRef.current = { startY: e.clientY, hasMoved: false };
    (e.target as SVGElement).setPointerCapture(e.pointerId);
  }, []);

  const handleLanePointerMove = useCallback((e: React.PointerEvent) => {
    if (!laneDragRef.current) return;
    const dy = Math.abs(e.clientY - laneDragRef.current.startY);
    if (!laneDragRef.current.hasMoved && dy >= DRAG_THRESHOLD) {
      laneDragRef.current.hasMoved = true;
      onLaneDragStart?.(lane.id, laneDragRef.current.startY, lane.heightPx);
      laneDragRef.current = null;
      (e.target as SVGElement).releasePointerCapture(e.pointerId);
    }
  }, [lane.id, lane.heightPx, onLaneDragStart]);

  const handleLanePointerUp = useCallback((e: React.PointerEvent) => {
    if (laneDragRef.current && !laneDragRef.current.hasMoved) {
      onLaneClick?.(e as unknown as React.MouseEvent, lane.id);
    }
    laneDragRef.current = null;
  }, [lane.id, onLaneClick]);

  return (
    <g className="swim-lane">
      {/* Lane label */}
      <rect x={0} y={yOffset} width={headerWidth} height={lane.heightPx}
        fill={isLaneSelected ? tc.accentLight : tc.laneLabelBg} stroke={tc.laneBorder} strokeWidth={1}
        style={{ cursor: 'grab' }}
        onPointerDown={(e) => { e.stopPropagation(); handleLanePointerDown(e); }}
        onPointerMove={handleLanePointerMove}
        onPointerUp={handleLanePointerUp}
        onContextMenu={(e) => {
          e.preventDefault();
          onLaneContextMenu?.(e, lane.id);
        }}
      />
      {labelLines.map((line, i) => {
        const tags = lane.tags ?? [];
        const tagAreaHeight = tags.length > 0 ? 14 : 0;
        const labelBlockHeight = labelLines.length * (fontSizeLaneTitle + 4) + tagAreaHeight;
        const labelStartY = yOffset + (lane.heightPx - labelBlockHeight) / 2 + fontSizeLaneTitle / 2;
        return (
          <text key={i}
            x={headerWidth / 2}
            y={labelStartY + i * (fontSizeLaneTitle + 4)}
            textAnchor="middle" dominantBaseline="central"
            fontSize={fontSizeLaneTitle} fontWeight="bold" fill={tc.laneLabelText}
            style={{ pointerEvents: 'none' }}>
            {line}
          </text>
        );
      })}

      {/* Tag badges */}
      {(() => {
        const tags = lane.tags ?? [];
        if (tags.length === 0) return null;
        const tagFontSize = 8;
        const tagPadX = 6;
        const tagPadY = 2;
        const tagHeight = tagFontSize + tagPadY * 2;
        const tagGap = 4;
        const labelBlockHeight = labelLines.length * (fontSizeLaneTitle + 4);
        const tagAreaTop = yOffset + (lane.heightPx - labelBlockHeight - 14) / 2 + labelBlockHeight + 4;

        // Measure tag widths (approximate: 5px per char + padding)
        const charWidth = 5;
        const tagWidths = tags.map((t) => t.length * charWidth + tagPadX * 2);

        // Layout tags in rows that fit within headerWidth
        const maxRowWidth = headerWidth - 8;
        const rows: { tag: string; width: number }[][] = [];
        let currentRow: { tag: string; width: number }[] = [];
        let currentRowWidth = 0;
        tags.forEach((tag, idx) => {
          const w = tagWidths[idx];
          if (currentRow.length > 0 && currentRowWidth + tagGap + w > maxRowWidth) {
            rows.push(currentRow);
            currentRow = [{ tag, width: w }];
            currentRowWidth = w;
          } else {
            if (currentRow.length > 0) currentRowWidth += tagGap;
            currentRow.push({ tag, width: w });
            currentRowWidth += w;
          }
        });
        if (currentRow.length > 0) rows.push(currentRow);

        return (
          <g style={{ pointerEvents: 'none' }}>
            {rows.map((row, ri) => {
              const rowWidth = row.reduce((s, t) => s + t.width, 0) + (row.length - 1) * tagGap;
              let x = (headerWidth - rowWidth) / 2;
              return row.map((item, ci) => {
                const rx = x;
                x += item.width + tagGap;
                return (
                  <g key={`${ri}-${ci}`}>
                    <rect
                      x={rx} y={tagAreaTop + ri * (tagHeight + 2)}
                      width={item.width} height={tagHeight}
                      rx={6} fill={tc.tagChipBg}
                    />
                    <text
                      x={rx + item.width / 2} y={tagAreaTop + ri * (tagHeight + 2) + tagHeight / 2}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize={tagFontSize} fill={tc.tagChipText}
                    >
                      {item.tag}
                    </text>
                  </g>
                );
              });
            })}
          </g>
        );
      })()}

      {/* Lane background */}
      <rect className="lane-bg" x={headerWidth} y={yOffset} width={totalWidth - headerWidth} height={lane.heightPx}
        fill="transparent" stroke="none" />

      {/* Bottom border */}
      <line x1={0} y1={yOffset + lane.heightPx} x2={totalWidth} y2={yOffset + lane.heightPx}
        stroke={tc.laneBorder} strokeWidth={1} />

      {/* Bars */}
      {lane.bars.map((bar) => (
        <ScheduleBarComponent
          key={bar.id}
          bar={bar}
          laneId={lane.id}
          pageId={pageId}
          laneY={yOffset}
          timeline={timeline}
          headerWidth={headerWidth}
          zoomLevel={zoomLevel}
          fontScale={fontScale}
          laneHeight={lane.heightPx}
          isSelected={selectedIds?.has(bar.id)}
          showMemos={showMemos}
          onDoubleClick={() => onBarDoubleClick(bar.id, lane.id)}
          onContextMenu={(e) => onContextMenu(e, 'bar', bar.id, lane.id)}
          onClick={(e) => onItemClick?.(e, 'bar', bar.id, lane.id)}
          onTooltipShow={onTooltipShow}
          onTooltipHide={onTooltipHide}
        />
      ))}

      {/* Milestones */}
      {lane.milestones.map((ms) => (
        <MilestoneComponent
          key={ms.id}
          milestone={ms}
          laneId={lane.id}
          pageId={pageId}
          laneY={yOffset}
          timeline={timeline}
          headerWidth={headerWidth}
          zoomLevel={zoomLevel}
          fontScale={fontScale}
          laneHeight={lane.heightPx}
          isSelected={selectedIds?.has(ms.id)}
          showMemos={showMemos}
          onDoubleClick={() => onMilestoneDoubleClick(ms.id, lane.id)}
          onContextMenu={(e) => onContextMenu(e, 'milestone', ms.id, lane.id)}
          onClick={(e) => onItemClick?.(e, 'milestone', ms.id, lane.id)}
          onTooltipShow={onTooltipShow}
          onTooltipHide={onTooltipHide}
        />
      ))}

      {/* Resize handle at bottom */}
      <LaneResizeHandle
        pageId={pageId}
        laneId={lane.id}
        y={yOffset + lane.heightPx}
        totalWidth={totalWidth}
        currentHeight={lane.heightPx}
      />
    </g>
  );
}
