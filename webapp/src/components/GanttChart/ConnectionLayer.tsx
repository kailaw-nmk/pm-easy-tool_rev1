import type { ResolvedConnection } from '../../lib/connection-utils';
import { useThemeColors } from '../../hooks/useThemeColors';

interface Props {
  resolvedConnections: ResolvedConnection[];
  showMemos?: boolean;
  selectedConnectionId?: string | null;
  onConnectionClick?: (e: React.MouseEvent, connectionId: string) => void;
  onConnectionDoubleClick?: (connectionId: string) => void;
  onConnectionContextMenu?: (e: React.MouseEvent, connectionId: string) => void;
}

export function ConnectionLayer({
  resolvedConnections,
  showMemos,
  selectedConnectionId,
  onConnectionClick,
  onConnectionDoubleClick,
  onConnectionContextMenu,
}: Props) {
  const tc = useThemeColors();

  if (resolvedConnections.length === 0) return null;

  return (
    <g className="connection-layer">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0 0, 8 3, 0 6" fill={tc.textSecondary} />
        </marker>
        <marker
          id="arrowhead-selected"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0 0, 8 3, 0 6" fill={tc.selectionStroke} />
        </marker>
      </defs>
      {resolvedConnections.map((rc) => {
        const { connection, fromX, fromY, toX, toY, lineType } = rc;
        const isSelected = selectedConnectionId === connection.id;
        const color = isSelected ? tc.selectionStroke : (connection.color ?? tc.textSecondary);
        const markerId = isSelected ? 'arrowhead-selected' : 'arrowhead';

        let pathD: string;
        if (lineType === 'straight') {
          pathD = `M ${fromX},${fromY} L ${toX},${toY}`;
        } else {
          const midX = (fromX + toX) / 2;
          pathD = `M ${fromX},${fromY} H ${midX} V ${toY} H ${toX}`;
        }

        const memoX = (fromX + toX) / 2;
        const memoY = lineType === 'straight'
          ? (fromY + toY) / 2 - 6
          : Math.min(fromY, toY) + Math.abs(toY - fromY) / 2 - 6;

        return (
          <g key={connection.id}>
            {/* Invisible wide hit area */}
            <path
              d={pathD}
              stroke="transparent"
              strokeWidth={12}
              fill="none"
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onConnectionClick?.(e, connection.id); }}
              onDoubleClick={(e) => { e.stopPropagation(); onConnectionDoubleClick?.(connection.id); }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onConnectionContextMenu?.(e, connection.id); }}
            />
            {/* Visible line */}
            <path
              d={pathD}
              stroke={color}
              strokeWidth={isSelected ? 2.5 : 1.5}
              fill="none"
              markerEnd={`url(#${markerId})`}
              pointerEvents="none"
            />
            {/* Memo text */}
            {showMemos && connection.memo && (
              <text
                x={memoX}
                y={memoY}
                textAnchor="middle"
                fontSize={9}
                fill={tc.textSecondary}
                pointerEvents="none"
                style={{ userSelect: 'none' }}
              >
                {connection.memo}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
