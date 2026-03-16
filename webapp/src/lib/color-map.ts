import type { ThemeMode } from './theme';

export interface ColorDef {
  fill: string;
  stroke: string;
  fontColor: string;
}

export const LEGACY_COLOR_NAMES = ['blue', 'pink', 'green', 'orange', 'gray', 'purple', 'red', 'security'] as const;

export const COLOR_MAP: Record<string, ColorDef> = {
  blue:     { fill: '#dae8fc', stroke: '#6c8ebf', fontColor: '#333333' },
  pink:     { fill: '#f8cecc', stroke: '#b85450', fontColor: '#333333' },
  green:    { fill: '#d5e8d4', stroke: '#82b366', fontColor: '#333333' },
  orange:   { fill: '#fff2cc', stroke: '#d6b656', fontColor: '#333333' },
  gray:     { fill: '#f5f5f5', stroke: '#999999', fontColor: '#333333' },
  purple:   { fill: '#e1d5e7', stroke: '#9673a6', fontColor: '#333333' },
  red:      { fill: '#e53935', stroke: '#c62828', fontColor: '#ffffff' },
  security: { fill: '#ffcdd2', stroke: '#e53935', fontColor: '#333333' },
};

const DARK_COLOR_MAP: Record<string, ColorDef> = {
  blue:     { fill: '#1e3a5f', stroke: '#60a5fa', fontColor: '#e0e7ff' },
  pink:     { fill: '#4a2020', stroke: '#f87171', fontColor: '#fecdd3' },
  green:    { fill: '#1a3a1a', stroke: '#86efac', fontColor: '#dcfce7' },
  orange:   { fill: '#3d2e0a', stroke: '#fbbf24', fontColor: '#fef3c7' },
  gray:     { fill: '#3f3f46', stroke: '#a1a1aa', fontColor: '#e4e4e7' },
  purple:   { fill: '#2e1a47', stroke: '#c084fc', fontColor: '#ede9fe' },
  red:      { fill: '#7f1d1d', stroke: '#f87171', fontColor: '#ffffff' },
  security: { fill: '#451a1a', stroke: '#f87171', fontColor: '#fecdd3' },
};

export function getColorMap(mode: ThemeMode): Record<string, ColorDef> {
  return mode === 'dark' ? DARK_COLOR_MAP : COLOR_MAP;
}

function darkenHex(hex: string, amount: number): string {
  const r = Math.max(0, Math.round(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function hexToColorDef(hex: string, mode: 'light' | 'dark'): ColorDef {
  const normalizedHex = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const fill = normalizedHex;
  const stroke = darkenHex(normalizedHex, 0.2);
  const fontColor = luminance(normalizedHex) > 0.5 ? '#333333' : '#ffffff';
  return { fill, stroke, fontColor };
}

export function resolveBarColor(color: string, mode: 'light' | 'dark'): ColorDef {
  const map = mode === 'dark' ? DARK_COLOR_MAP : COLOR_MAP;
  if (map[color]) return map[color];
  if (/^#[0-9a-fA-F]{3,6}$/.test(color)) return hexToColorDef(color, mode);
  return map['gray'];
}

// Reverse lookup: fillColor -> BarColor
const FILL_TO_COLOR: Record<string, string> = {
  '#dae8fc': 'blue',
  '#f8cecc': 'pink',
  '#d5e8d4': 'green',
  '#fff2cc': 'orange',
  '#f5f5f5': 'gray',
  '#e1d5e7': 'purple',
  '#e53935': 'red',
  '#ffcdd2': 'security',
};

export function fillColorToBarColor(fill: string): string {
  return FILL_TO_COLOR[fill.toLowerCase()] ?? 'gray';
}

// Extended preset colors for ColorPicker (~20 colors)
export const PRESET_COLORS: { name: string; hex: string }[] = [
  // Legacy 8 colors (use name strings)
  { name: 'blue', hex: '#dae8fc' },
  { name: 'pink', hex: '#f8cecc' },
  { name: 'green', hex: '#d5e8d4' },
  { name: 'orange', hex: '#fff2cc' },
  { name: 'gray', hex: '#f5f5f5' },
  { name: 'purple', hex: '#e1d5e7' },
  { name: 'red', hex: '#e53935' },
  { name: 'security', hex: '#ffcdd2' },
  // Additional 12 colors (use hex strings)
  { name: '#4fc3f7', hex: '#4fc3f7' },  // light blue
  { name: '#81c784', hex: '#81c784' },  // medium green
  { name: '#ffb74d', hex: '#ffb74d' },  // amber
  { name: '#ff8a65', hex: '#ff8a65' },  // deep orange
  { name: '#ba68c8', hex: '#ba68c8' },  // medium purple
  { name: '#4dd0e1', hex: '#4dd0e1' },  // cyan
  { name: '#aed581', hex: '#aed581' },  // light green
  { name: '#fff176', hex: '#fff176' },  // yellow
  { name: '#f06292', hex: '#f06292' },  // medium pink
  { name: '#90a4ae', hex: '#90a4ae' },  // blue gray
  { name: '#a1887f', hex: '#a1887f' },  // brown
  { name: '#7986cb', hex: '#7986cb' },  // indigo
];
