import { useUIStore } from '../hooks/useUIStore';
import { useScheduleStore } from '../hooks/useScheduleStore';

export function SettingsPopover() {
  const {
    fontSizeLaneTitle, setFontSizeLaneTitle,
    fontSizeBarText, setFontSizeBarText,
    fontSizeMilestone, setFontSizeMilestone,
    displayMode,
  } = useUIStore();

  const { data, currentPageId, updateTimeline, updateMonthWidth, updatePageTimeline, updatePageMonthWidth } = useScheduleStore();
  const page = data?.pages.find((p) => p.id === currentPageId);
  const hasPageTimeline = !!page?.timeline;
  const timeline = page?.timeline ?? data?.timeline;

  return (
    <div className="settings-popover">
      <div className="settings-row">
        <label>レーンタイトル</label>
        <input type="range" min={5} max={16} value={fontSizeLaneTitle}
          onChange={(e) => setFontSizeLaneTitle(Number(e.target.value))} />
        <span>{fontSizeLaneTitle}px</span>
      </div>
      <div className="settings-row">
        <label>バーテキスト</label>
        <input type="range" min={5} max={16} value={fontSizeBarText}
          onChange={(e) => setFontSizeBarText(Number(e.target.value))} />
        <span>{fontSizeBarText}px</span>
      </div>
      <div className="settings-row">
        <label>マイルストーン</label>
        <input type="range" min={5} max={16} value={fontSizeMilestone}
          onChange={(e) => setFontSizeMilestone(Number(e.target.value))} />
        <span>{fontSizeMilestone}px</span>
      </div>
      {timeline && displayMode === 'fixed' && (
        <>
          <div className="settings-section-divider" />
          <div className="settings-section-label">月幅（Fixed モード）</div>
          <div className="settings-row">
            <label>月幅</label>
            <input type="range" min={20} max={120} value={timeline.monthWidthPx}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (hasPageTimeline) {
                  updatePageMonthWidth(currentPageId, v);
                } else {
                  updateMonthWidth(v);
                }
              }} />
            <span>{timeline.monthWidthPx}px</span>
          </div>
        </>
      )}
      {timeline && (
        <>
          <div className="settings-section-divider" />
          <div className="settings-section-label">タイムライン範囲</div>
          <div className="settings-row">
            <label>開始</label>
            <input type="month" value={timeline.startDate.substring(0, 7)}
              onChange={(e) => {
                const v = e.target.value;
                if (hasPageTimeline) {
                  updatePageTimeline(currentPageId, { startDate: v });
                } else {
                  updateTimeline({ startDate: v });
                }
              }} />
          </div>
          <div className="settings-row">
            <label>終了</label>
            <input type="month" value={timeline.endDate.substring(0, 7)}
              onChange={(e) => {
                const v = e.target.value;
                if (hasPageTimeline) {
                  updatePageTimeline(currentPageId, { endDate: v });
                } else {
                  updateTimeline({ endDate: v });
                }
              }} />
          </div>
        </>
      )}
    </div>
  );
}
