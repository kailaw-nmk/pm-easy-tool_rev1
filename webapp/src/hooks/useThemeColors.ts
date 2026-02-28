import { useUIStore } from './useUIStore';
import { getTheme, type ThemeColors } from '../lib/theme';

export function useThemeColors(): ThemeColors {
  const themeMode = useUIStore((s) => s.themeMode);
  return getTheme(themeMode);
}
