import { useState } from 'react';
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
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);

  if (resolvedConnections.length === 0) return null;

  // Lighten a hex color for hover effect
  const lightenColor = (hex: string, amount: number): string => {
    const h = hex.replace('#', '');
    if (h.length !== 6) return hex;
    const r = Math.min(255, parseInt(h.slice(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(h.slice(2, 4), 16) + amount);
    const b = Math.min(255, parseInt(h.slice(4, 6), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

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
        <marker
          id="arrowhead-hovered"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon points="0 0, 8 3, 0 6" fill={tc.accent} />
        </marker>
      </defs>
      {resolvedConnections.map((rc) => {
        const { connection, fromX, fromY, toX, toY, lineType } = rc;
        const isSelected = selectedConnectionId === connection.id;
        const isHovered = hoveredConnectionId === connection.id;
        const baseColor = connection.color ?? tc.textSecondary;
        const color = isSelected
          ? tc.selectionStroke
          : isHovered
            ? lightenColor(baseColor, 60)
            : baseColor;
        const baseWidth = connection.strokeWidth ?? 1.5;
        const strokeWidth = isSelected ? baseWidth + 1 : isHovered ? baseWidth + 0.5 : baseWidth;
        const markerId = isSelected ? 'arrowhead-selected' : isHovered ? 'arrowhead-hovered' : 'arrowhead';

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

        // Bubble memo dimensions
        const memoText = connection.memo;
        const bubblePadX = 6;
        const bubblePadY = 3;
        const memoFontSize = 9;
        const charWidth = memoFontSize * 0.65;
        const textW = memoText ? memoText.length * charWidth : 0;
        const bubbleW = textW + bubblePadX * 2;
        const bubbleH = memoFontSize + bubblePadY * 2;
        const bubbleX = memoX - bubbleW / 2;
        const bubbleY = memoY - bubbleH + 2;
        const triSize = 4;

        return (
          <g key={connection.id}>
            {/* Invisible wide hit area */}
            <path
              d={pathD}
              stroke="transparent"
              strokeWidth={Math.max(12, baseWidth + 8)}
              fill="none"
              style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); onConnectionClick?.(e, connection.id); }}
              onDoubleClick={(e) => { e.stopPropagation(); onConnectionDoubleClick?.(connection.id); }}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onConnectionContextMenu?.(e, connection.id); }}
              onMouseEnter={() => setHoveredConnectionId(connection.id)}
              onMouseLeave={() => setHoveredConnectionId(null)}
            />
            {/* Visible line */}
            <path
              d={pathD}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              markerEnd={`url(#${markerId})`}
              pointerEvents="none"
            />
            {/* Memo bubble */}
            {showMemos && memoText && (
              <g pointerEvents="none">
                {/* Bubble background */}
                <rect
                  x={bubbleX}
                  y={bubbleY}
                  width={bubbleW}
                  height={bubbleH}
                  rx={4}
                  ry={4}
                  fill={tc.tooltipBg ?? tc.surface}
                  stroke={tc.border}
                  strokeWidth={0.5}
                  opacity={0.92}
                />
                {/* Triangle pointer */}
                <polygon
                  points={`${memoX - triSize},${bubbleY + bubbleH} ${memoX + triSize},${bubbleY + bubbleH} ${memoX},${bubbleY + bubbleH + triSize}`}
                  fill={tc.tooltipBg ?? tc.surface}
                  stroke={tc.border}
                  strokeWidth={0.5}
                />
                {/* Cover the triangle top border with a line matching bg */}
                <line
                  x1={memoX - triSize + 0.5}
                  y1={bubbleY + bubbleH}
                  x2={memoX + triSize - 0.5}
                  y2={bubbleY + bubbleH}
                  stroke={tc.tooltipBg ?? tc.surface}
                  strokeWidth={1}
                />
                {/* Memo text */}
                <text
                  x={memoX}
                  y={bubbleY + bubblePadY + memoFontSize - 1}
                  textAnchor="middle"
                  fontSize={memoFontSize}
                  fill={tc.tooltipText ?? tc.textPrimary}
                  style={{ userSelect: 'none' }}
                >
                  {memoText}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
