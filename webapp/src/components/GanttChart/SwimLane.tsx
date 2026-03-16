import type { SwimLane as SwimLaneType, PageTimeline, ZoomLevel } from '../../types/schedule';
import { ScheduleBarComponent } from './ScheduleBar';
import { MilestoneComponent } from './Milestone';
import { LaneResizeHandle } from './LaneResizeHandle';
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
  onTooltipShow?: (text: string, x: number, y: number) => void;
  onTooltipHide?: () => void;
  // Multi-bar drag
  multiDragOffset?: { dx: number; dy: number } | null;
  multiDragBarIds?: Set<string>;
  onMultiDragMove?: (dx: number, dy: number) => void;
  onMultiDragEnd?: (dx: number, dy: number) => void;
}

export function SwimLaneComponent({
  lane, pageId, yOffset, timeline, headerWidth, totalWidth, zoomLevel, fontScale = 1.0,
  selectedIds, showMemos,
  onBarDoubleClick, onMilestoneDoubleClick, onContextMenu, onItemClick,
  onTooltipShow, onTooltipHide,
  multiDragOffset, multiDragBarIds, onMultiDragMove, onMultiDragEnd,
}: Props) {
  const tc = useThemeColors();

  return (
    <g className="swim-lane">
      {/* Lane background */}
      <rect className="lane-bg" x={headerWidth} y={yOffset} width={totalWidth - headerWidth} height={lane.heightPx}
        fill="transparent" stroke="none" />

      {/* Bottom border */}
      <line x1={headerWidth} y1={yOffset + lane.heightPx} x2={totalWidth} y2={yOffset + lane.heightPx}
        stroke={tc.laneBorder} strokeWidth={1} />

      {/* Bars and Milestones (clipped to content area) */}
      <g clipPath="url(#content-area-clip)">
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
            multiDragOffset={multiDragBarIds?.has(bar.id) ? multiDragOffset : null}
            isMultiSelected={multiDragBarIds?.has(bar.id)}
            onMultiDragMove={multiDragBarIds?.has(bar.id) ? onMultiDragMove : undefined}
            onMultiDragEnd={multiDragBarIds?.has(bar.id) ? onMultiDragEnd : undefined}
          />
        ))}

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
      </g>

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
