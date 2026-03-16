import type { SwimLane as SwimLaneType } from '../../types/schedule';
import { LaneHeaderItem } from './LaneHeaderItem';
import { useThemeColors } from '../../hooks/useThemeColors';

interface LaneOffset {
  laneId: string;
  y: number;
}

interface LaneDragState {
  laneId: string;
  startY: number;
  currentY: number;
  laneHeight: number;
  originalIndex: number;
}

interface Props {
  lanes: SwimLaneType[];
  laneOffsets: LaneOffset[];
  headerWidth: number;
  bodyHeight: number;
  fontScale?: number;
  selectedIds: Set<string>;
  laneDrag: LaneDragState | null;
  onLaneContextMenu: (e: React.MouseEvent, laneId: string) => void;
  onLaneClick: (e: React.MouseEvent, laneId: string) => void;
  onLaneDragStart: (laneId: string, startY: number, laneHeight: number) => void;
}

export function LaneHeaderOverlay({
  lanes, laneOffsets, headerWidth, bodyHeight, fontScale,
  selectedIds, laneDrag,
  onLaneContextMenu, onLaneClick, onLaneDragStart,
}: Props) {
  const tc = useThemeColors();

  return (
    <div
      className="lane-header-overlay"
      style={{
        position: 'sticky',
        left: 0,
        width: headerWidth,
        height: bodyHeight,
        marginTop: -bodyHeight,
        zIndex: 5,
        pointerEvents: 'auto',
        lineHeight: 0,
      }}
    >
      <svg width={headerWidth} height={bodyHeight} style={{ display: 'block' }}>
        {lanes.map((lane, i) => {
          const offset = laneOffsets[i];
          return (
            <LaneHeaderItem
              key={lane.id}
              lane={lane}
              yOffset={offset.y}
              headerWidth={headerWidth}
              fontScale={fontScale}
              isLaneSelected={selectedIds.has(lane.id)}
              onLaneContextMenu={onLaneContextMenu}
              onLaneClick={onLaneClick}
              onLaneDragStart={onLaneDragStart}
            />
          );
        })}

        {/* Lane drag ghost (header portion only) */}
        {laneDrag && (() => {
          const dy = laneDrag.currentY - laneDrag.startY;
          const origOffset = laneOffsets.find((lo) => lo.laneId === laneDrag.laneId);
          if (!origOffset) return null;
          return (
            <rect
              x={0} y={origOffset.y + dy}
              width={headerWidth} height={laneDrag.laneHeight}
              fill={tc.accentLight} opacity={0.4}
              stroke={tc.selectionStroke} strokeWidth={2}
              pointerEvents="none"
            />
          );
        })()}
      </svg>
    </div>
  );
}
