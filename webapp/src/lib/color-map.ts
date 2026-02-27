import type { BarColor } from '../types/schedule';
import type { ThemeMode } from './theme';

export interface ColorDef {
  fill: string;
  stroke: string;
  fontColor: string;
}

export const COLOR_MAP: Record<BarColor, ColorDef> = {
  blue:     { fill: '#dae8fc', stroke: '#6c8ebf', fontColor: '#333333' },
  pink:     { fill: '#f8cecc', stroke: '#b85450', fontColor: '#333333' },
  green:    { fill: '#d5e8d4', stroke: '#82b366', fontColor: '#333333' },
  orange:   { fill: '#fff2cc', stroke: '#d6b656', fontColor: '#333333' },
  gray:     { fill: '#f5f5f5', stroke: '#999999', fontColor: '#333333' },
  purple:   { fill: '#e1d5e7', stroke: '#9673a6', fontColor: '#333333' },
  red:      { fill: '#e53935', stroke: '#c62828', fontColor: '#ffffff' },
  security: { fill: '#ffcdd2', stroke: '#e53935', fontColor: '#333333' },
};

const DARK_COLOR_MAP: Record<BarColor, ColorDef> = {
  blue:     { fill: '#1e3a5f', stroke: '#60a5fa', fontColor: '#e0e7ff' },
  pink:     { fill: '#4a2020', stroke: '#f87171', fontColor: '#fecdd3' },
  green:    { fill: '#1a3a1a', stroke: '#86efac', fontColor: '#dcfce7' },
  orange:   { fill: '#3d2e0a', stroke: '#fbbf24', fontColor: '#fef3c7' },
  gray:     { fill: '#3f3f46', stroke: '#a1a1aa', fontColor: '#e4e4e7' },
  purple:   { fill: '#2e1a47', stroke: '#c084fc', fontColor: '#ede9fe' },
  red:      { fill: '#7f1d1d', stroke: '#f87171', fontColor: '#ffffff' },
  security: { fill: '#451a1a', stroke: '#f87171', fontColor: '#fecdd3' },
};

export function getColorMap(mode: ThemeMode): Record<BarColor, ColorDef> {
  return mode === 'dark' ? DARK_COLOR_MAP : COLOR_MAP;
}

// Reverse lookup: fillColor -> BarColor
const FILL_TO_COLOR: Record<string, BarColor> = {
  '#dae8fc': 'blue',
  '#f8cecc': 'pink',
  '#d5e8d4': 'green',
  '#fff2cc': 'orange',
  '#f5f5f5': 'gray',
  '#e1d5e7': 'purple',
  '#e53935': 'red',
  '#ffcdd2': 'security',
};

export function fillColorToBarColor(fill: string): BarColor {
  return FILL_TO_COLOR[fill.toLowerCase()] ?? 'gray';
}
