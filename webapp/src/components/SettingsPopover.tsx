import { useUIStore } from '../hooks/useUIStore';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { PRESET_COLORS, LEGACY_COLOR_NAMES, resolveBarColor } from '../lib/color-map';
import { useThemeColors } from '../hooks/useThemeColors';

function InlineColorPicker({ value, onChange, themeMode }: { value: string; onChange: (c: string) => void; themeMode: string }) {
  const tc = useThemeColors();
  const resolved = resolveBarColor(value, themeMode as 'light' | 'dark');
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '4px' }}>
        {PRESET_COLORS.map((preset) => {
          const isLegacy = (LEGACY_COLOR_NAMES as readonly string[]).includes(preset.name);
          const displayColor = resolveBarColor(preset.name, themeMode as 'light' | 'dark');
          const isSelected = value === preset.name || value === preset.hex;
          return (
            <div
              key={preset.name}
              onClick={() => onChange(isLegacy ? preset.name : preset.hex)}
              title={preset.name}
              style={{
                width: '18px', height: '18px', borderRadius: '3px',
                background: displayColor.fill,
                border: isSelected ? `2px solid ${tc.accent}` : `1px solid ${tc.inputBorder}`,
                cursor: 'pointer', boxSizing: 'border-box',
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input type="color" value={resolved.fill} onChange={(e) => onChange(e.target.value)}
          style={{ width: '24px', height: '22px', padding: 0, border: 'none', cursor: 'pointer' }} />
        <span style={{ fontSize: '11px', color: tc.textMuted }}>カスタム</span>
        <span style={{ fontSize: '10px', color: tc.textMuted, marginLeft: 'auto' }}>{value}</span>
      </div>
    </div>
  );
}

export function SettingsPopover() {
  const {
    fontSizeLaneTitle, setFontSizeLaneTitle,
    fontSizeBarText, setFontSizeBarText,
    fontSizeMilestone, setFontSizeMilestone,
    fontSizeCalendar, setFontSizeCalendar,
    fontSizeTipMemo, setFontSizeTipMemo,
    fontSizeTextBox, setFontSizeTextBox,
    displayMode,
    defaultConnectionColor, setDefaultConnectionColor,
    defaultConnectionStrokeWidth, setDefaultConnectionStrokeWidth,
    defaultScheduleLineColor, setDefaultScheduleLineColor,
    defaultScheduleLineStrokeWidth, setDefaultScheduleLineStrokeWidth,
    defaultScheduleLineStyle, setDefaultScheduleLineStyle,
    themeMode,
  } = useUIStore();

  const { data, currentPageId, updatePageTimeline, updatePageMonthWidth, clearPageTimeline } = useScheduleStore();
  const page = data?.pages.find((p) => p.id === currentPageId);
  const hasPageTimeline = !!page?.timeline;
  const timeline = page?.timeline ?? data?.timeline;

  return (
    <div className="settings-popover">
      <div className="settings-row">
        <label>レーンタイトル</label>
        <input type="range" min={5} max={50} value={fontSizeLaneTitle}
          onChange={(e) => setFontSizeLaneTitle(Number(e.target.value))} />
        <span>{fontSizeLaneTitle}px</span>
      </div>
      <div className="settings-row">
        <label>バーテキスト</label>
        <input type="range" min={5} max={50} value={fontSizeBarText}
          onChange={(e) => setFontSizeBarText(Number(e.target.value))} />
        <span>{fontSizeBarText}px</span>
      </div>
      <div className="settings-row">
        <label>マイルストーン</label>
        <input type="range" min={5} max={50} value={fontSizeMilestone}
          onChange={(e) => setFontSizeMilestone(Number(e.target.value))} />
        <span>{fontSizeMilestone}px</span>
      </div>
      <div className="settings-row">
        <label>カレンダー</label>
        <input type="range" min={5} max={50} value={fontSizeCalendar}
          onChange={(e) => setFontSizeCalendar(Number(e.target.value))} />
        <span>{fontSizeCalendar}px</span>
      </div>
      <div className="settings-row">
        <label>Tip/Memo</label>
        <input type="range" min={6} max={48} value={fontSizeTipMemo}
          onChange={(e) => setFontSizeTipMemo(Number(e.target.value))} />
        <span>{fontSizeTipMemo}px</span>
      </div>
      <div className="settings-row">
        <label>テキストボックス</label>
        <input type="range" min={6} max={48} value={fontSizeTextBox}
          onChange={(e) => setFontSizeTextBox(Number(e.target.value))} />
        <span>{fontSizeTextBox}px</span>
      </div>
      {timeline && displayMode === 'fixed' && (
        <>
          <div className="settings-section-divider" />
          <div className="settings-section-label">月幅（Fixed モード）{hasPageTimeline ? '（このページ）' : '（全ページ共通）'}</div>
          <div className="settings-row">
            <label>月幅</label>
            <input type="range" min={20} max={120} value={timeline.monthWidthPx}
              onChange={(e) => {
                const v = Number(e.target.value);
                updatePageMonthWidth(currentPageId, v);
              }} />
            <span>{timeline.monthWidthPx}px</span>
          </div>
        </>
      )}
      {timeline && (
        <>
          <div className="settings-section-divider" />
          <div className="settings-section-label">タイムライン範囲{hasPageTimeline ? '（このページ）' : '（全ページ共通）'}</div>
          <div className="settings-row">
            <label>開始</label>
            <input type="month" value={timeline.startDate.substring(0, 7)}
              onChange={(e) => {
                const v = e.target.value;
                updatePageTimeline(currentPageId, { startDate: v });
              }} />
          </div>
          <div className="settings-row">
            <label>終了</label>
            <input type="month" value={timeline.endDate.substring(0, 7)}
              onChange={(e) => {
                const v = e.target.value;
                updatePageTimeline(currentPageId, { endDate: v });
              }} />
          </div>
          {hasPageTimeline && (
            <div className="settings-row">
              <button
                onClick={() => clearPageTimeline(currentPageId)}
                style={{
                  fontSize: '11px', padding: '2px 8px', cursor: 'pointer',
                  border: '1px solid #999', borderRadius: '3px', background: 'transparent',
                  color: 'inherit', width: '100%',
                }}
              >
                グローバル設定に戻す
              </button>
            </div>
          )}
        </>
      )}

      <div className="settings-section-divider" />
      <div className="settings-section-label">接続線デフォルト</div>
      <div className="settings-row">
        <label>カラー</label>
      </div>
      <InlineColorPicker value={defaultConnectionColor} onChange={setDefaultConnectionColor} themeMode={themeMode} />
      <div className="settings-row">
        <label>線の太さ</label>
        <input type="range" min={0.5} max={6} step={0.5} value={defaultConnectionStrokeWidth}
          onChange={(e) => setDefaultConnectionStrokeWidth(Number(e.target.value))} />
        <span>{defaultConnectionStrokeWidth}px</span>
      </div>

      <div className="settings-section-divider" />
      <div className="settings-section-label">スケジュールラインデフォルト</div>
      <div className="settings-row">
        <label>カラー</label>
      </div>
      <InlineColorPicker value={defaultScheduleLineColor} onChange={setDefaultScheduleLineColor} themeMode={themeMode} />
      <div className="settings-row">
        <label>線の太さ</label>
        <input type="range" min={0.5} max={6} step={0.5} value={defaultScheduleLineStrokeWidth}
          onChange={(e) => setDefaultScheduleLineStrokeWidth(Number(e.target.value))} />
        <span>{defaultScheduleLineStrokeWidth}px</span>
      </div>
      <div className="settings-row">
        <label>線のスタイル</label>
        <select value={defaultScheduleLineStyle} onChange={(e) => setDefaultScheduleLineStyle(e.target.value as 'solid' | 'dashed' | 'dotted')}>
          <option value="solid">実線</option>
          <option value="dashed">破線</option>
          <option value="dotted">点線</option>
        </select>
      </div>
    </div>
  );
}
