import { PRESET_COLORS, LEGACY_COLOR_NAMES, resolveBarColor } from '../lib/color-map';
import { useUIStore } from '../hooks/useUIStore';
import { useThemeColors } from '../hooks/useThemeColors';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const themeMode = useUIStore((s) => s.themeMode);
  const tc = useThemeColors();
  const resolved = resolveBarColor(value, themeMode);

  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
        {PRESET_COLORS.map((preset) => {
          const isLegacy = (LEGACY_COLOR_NAMES as readonly string[]).includes(preset.name);
          const displayColor = resolveBarColor(preset.name, themeMode);
          const isSelected = value === preset.name;
          return (
            <div
              key={preset.name}
              onClick={() => onChange(isLegacy ? preset.name : preset.hex)}
              title={preset.name}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: displayColor.fill,
                border: isSelected ? `2px solid ${tc.accent}` : `1px solid ${tc.inputBorder}`,
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="color"
          value={resolved.fill}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '32px', height: '28px', padding: 0, border: 'none', cursor: 'pointer' }}
        />
        <span style={{ fontSize: '12px', color: tc.textMuted }}>
          カスタムカラー
        </span>
        <span style={{ fontSize: '12px', color: tc.textMuted, marginLeft: 'auto' }}>
          {value}
        </span>
      </div>
    </div>
  );
}
