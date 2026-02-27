import type { SwimLane as SwimLaneType, PageTimeline, ZoomLevel } from '../../types/schedule';
import { ScheduleBarComponent } from './ScheduleBar';
import { MilestoneComponent } from './Milestone';
import { LaneResizeHandle } from './LaneResizeHandle';
import { useUIStore } from '../../hooks/useUIStore';

interface Props {
  lane: SwimLaneType;
  pageId: string;
  yOffset: number;
  timeline: PageTimeline;
  headerWidth: number;
  totalWidth: number;
  zoomLevel: ZoomLevel;
  selectedIds?: Set<string>;
  showMemos?: boolean;
  onBarDoubleClick: (barId: string, laneId: string) => void;
  onMilestoneDoubleClick: (msId: string, laneId: string) => void;
  onContextMenu: (e: React.MouseEvent, type: 'bar' | 'milestone', id: string, laneId: string) => void;
  onItemClick?: (e: React.MouseEvent, type: 'bar' | 'milestone', id: string, laneId: string) => void;
  onLaneContextMenu?: (e: React.MouseEvent, laneId: string) => void;
  onTooltipShow?: (text: string, x: number, y: number) => void;
  onTooltipHide?: () => void;
}

export function SwimLaneComponent({
  lane, pageId, yOffset, timeline, headerWidth, totalWidth, zoomLevel,
  selectedIds, showMemos,
  onBarDoubleClick, onMilestoneDoubleClick, onContextMenu, onItemClick,
  onLaneContextMenu, onTooltipShow, onTooltipHide,
}: Props) {
  const fontSizeLaneTitle = useUIStore((s) => s.fontSizeLaneTitle);
  const labelLines = lane.label.split('\n');

  return (
    <g className="swim-lane">
      {/* Lane label */}
      <rect x={0} y={yOffset} width={headerWidth} height={lane.heightPx}
        fill="#f5f5f5" stroke="#e0e0e0" strokeWidth={1}
        onContextMenu={(e) => {
          e.preventDefault();
          onLaneContextMenu?.(e, lane.id);
        }}
      />
      {labelLines.map((line, i) => (
        <text key={i}
          x={headerWidth / 2}
          y={yOffset + lane.heightPx / 2 + (i - (labelLines.length - 1) / 2) * (fontSizeLaneTitle + 4)}
          textAnchor="middle" dominantBaseline="central"
          fontSize={fontSizeLaneTitle} fontWeight="bold" fill="#333"
          style={{ pointerEvents: 'none' }}>
          {line}
        </text>
      ))}

      {/* Lane background */}
      <rect x={headerWidth} y={yOffset} width={totalWidth - headerWidth} height={lane.heightPx}
        fill="transparent" stroke="none" />

      {/* Bottom border */}
      <line x1={0} y1={yOffset + lane.heightPx} x2={totalWidth} y2={yOffset + lane.heightPx}
        stroke="#e0e0e0" strokeWidth={1} />

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
