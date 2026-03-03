import { useEffect, useMemo, useState } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';
import { useThemeColors } from '../hooks/useThemeColors';
import type { LaneTemplate } from '../types/schedule';

interface Props {
  onClose: () => void;
}

export function LaneRegistryPanel({ onClose }: Props) {
  const { data, currentPageId, syncLaneRegistry, updateRegistryTemplate, addRegistryTemplate, removeRegistryTemplate, addLaneFromTemplate, removeLane } = useScheduleStore();
  const tc = useThemeColors();
  const registry = data?.laneRegistry ?? [];
  const pages = data?.pages ?? [];
  const currentPage = pages.find((p) => p.id === currentPageId);

  // マウント時にレジストリを同期
  useEffect(() => {
    syncLaneRegistry();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // セクション折りたたみ
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  // テンプレート分類
  const { inCurrent, inOther, unused } = useMemo(() => {
    const cur: LaneTemplate[] = [];
    const other: LaneTemplate[] = [];
    const none: LaneTemplate[] = [];
    for (const tmpl of registry) {
      const inCurrentPage = currentPage?.swimLanes.some((l) => l.registryId === tmpl.id) ?? false;
      if (inCurrentPage) { cur.push(tmpl); continue; }
      const inAnyOther = pages.some(
        (p) => p.id !== currentPageId && p.swimLanes.some((l) => l.registryId === tmpl.id)
      );
      if (inAnyOther) { other.push(tmpl); } else { none.push(tmpl); }
    }
    return { inCurrent: cur, inOther: other, unused: none };
  }, [registry, pages, currentPageId, currentPage]);

  const handleLabelChange = (templateId: string, label: string) => {
    updateRegistryTemplate(templateId, { label });
  };

  const handleHeightChange = (templateId: string, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 20) {
      updateRegistryTemplate(templateId, { defaultHeightPx: num });
    }
  };

  const isTemplateInPage = (templateId: string, pageId: string): boolean => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return false;
    return page.swimLanes.some((l) => l.registryId === templateId);
  };

  const handleToggleSchedule = (templateId: string, pageId: string, checked: boolean) => {
    if (checked) {
      addLaneFromTemplate(pageId, templateId);
    } else {
      const page = pages.find((p) => p.id === pageId);
      if (!page) return;
      const lane = page.swimLanes.find((l) => l.registryId === templateId);
      if (lane) {
        removeLane(pageId, lane.id);
      }
    }
  };

  const handleAddToCurrent = (templateId: string) => {
    addLaneFromTemplate(currentPageId, templateId);
  };

  const handleRemoveFromCurrent = (templateId: string) => {
    if (!currentPage) return;
    const lane = currentPage.swimLanes.find((l) => l.registryId === templateId);
    if (lane) removeLane(currentPageId, lane.id);
  };

  const handleAddTemplate = () => {
    addRegistryTemplate({
      id: `tmpl_${Date.now()}`,
      label: '新規レーン',
      tags: [],
      defaultHeightPx: 80,
    });
  };

  // 共通入力スタイル
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '4px 6px',
    border: `1px solid ${tc.inputBorder}`, borderRadius: 4,
    fontSize: 13, fontFamily: 'inherit',
    background: tc.inputBg, color: tc.textPrimary,
  };

  const numberInputStyle: React.CSSProperties = {
    width: 60, padding: '4px 6px',
    border: `1px solid ${tc.inputBorder}`, borderRadius: 4,
    fontSize: 13, fontFamily: 'inherit', textAlign: 'right',
    background: tc.inputBg, color: tc.textPrimary,
  };

  const btnStyle = (color: string): React.CSSProperties => ({
    padding: '4px 10px',
    border: `1px solid ${color}`, borderRadius: 4,
    background: 'transparent', color,
    cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
  });

  // セクションヘッダー
  const renderSectionHeader = (key: string, label: string, count: number) => {
    const isCollapsed = collapsed[key] ?? false;
    return (
      <div
        className="lane-section-header"
        onClick={() => toggle(key)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 4px', cursor: 'pointer', userSelect: 'none',
          borderBottom: `1px solid ${tc.border}`,
        }}
      >
        <span style={{ fontSize: 12, color: tc.textSecondary, width: 14, textAlign: 'center' }}>
          {isCollapsed ? '▶' : '▼'}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: tc.textPrimary }}>{label}</span>
        <span style={{ fontSize: 12, color: tc.textSecondary }}>({count}件)</span>
      </div>
    );
  };

  // セクション1: このスケジュールのレーン
  const renderCurrentSection = () => {
    const key = 'current';
    const isCollapsed = collapsed[key] ?? false;
    const otherPages = pages.filter((p) => p.id !== currentPageId);

    return (
      <div style={{ marginBottom: 16 }}>
        {renderSectionHeader(key, 'このスケジュールのレーン', inCurrent.length)}
        {!isCollapsed && (
          inCurrent.length === 0 ? (
            <div style={{ padding: '12px 8px', fontSize: 13, color: tc.textSecondary }}>該当なし</div>
          ) : (
            <table className="lane-registry-table">
              <thead>
                <tr>
                  <th>ラベル</th>
                  {otherPages.length > 0 && <th>他のスケジュール</th>}
                  <th>高さ(px)</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {inCurrent.map((tmpl) => (
                  <tr key={tmpl.id}>
                    <td>
                      <input type="text" value={tmpl.label} onChange={(e) => handleLabelChange(tmpl.id, e.target.value)} style={inputStyle} />
                    </td>
                    {otherPages.length > 0 && (
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', alignItems: 'center' }}>
                          {otherPages.map((page) => (
                            <label key={page.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', color: tc.textPrimary }}>
                              <input type="checkbox" checked={isTemplateInPage(tmpl.id, page.id)} onChange={(e) => handleToggleSchedule(tmpl.id, page.id, e.target.checked)} style={{ accentColor: tc.accent }} />
                              {page.name}
                            </label>
                          ))}
                        </div>
                      </td>
                    )}
                    <td>
                      <input type="number" value={tmpl.defaultHeightPx} onChange={(e) => handleHeightChange(tmpl.id, e.target.value)} min={20} style={numberInputStyle} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleRemoveFromCurrent(tmpl.id)} style={btnStyle(tc.accent)}>解除</button>
                        <button onClick={() => removeRegistryTemplate(tmpl.id)} style={btnStyle(tc.danger)}>削除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    );
  };

  // セクション2: 他のスケジュールのレーン
  const renderOtherSection = () => {
    const key = 'other';
    const isCollapsed = collapsed[key] ?? false;

    return (
      <div style={{ marginBottom: 16 }}>
        {renderSectionHeader(key, '他のスケジュールのレーン', inOther.length)}
        {!isCollapsed && (
          inOther.length === 0 ? (
            <div style={{ padding: '12px 8px', fontSize: 13, color: tc.textSecondary }}>該当なし</div>
          ) : (
            <table className="lane-registry-table">
              <thead>
                <tr>
                  <th>ラベル</th>
                  <th>所属スケジュール</th>
                  <th>高さ(px)</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {inOther.map((tmpl) => (
                  <tr key={tmpl.id}>
                    <td>
                      <input type="text" value={tmpl.label} onChange={(e) => handleLabelChange(tmpl.id, e.target.value)} style={inputStyle} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', alignItems: 'center' }}>
                        {pages.map((page) => (
                          <label key={page.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', color: tc.textPrimary }}>
                            <input type="checkbox" checked={isTemplateInPage(tmpl.id, page.id)} onChange={(e) => handleToggleSchedule(tmpl.id, page.id, e.target.checked)} style={{ accentColor: tc.accent }} />
                            {page.name}
                          </label>
                        ))}
                      </div>
                    </td>
                    <td>
                      <input type="number" value={tmpl.defaultHeightPx} onChange={(e) => handleHeightChange(tmpl.id, e.target.value)} min={20} style={numberInputStyle} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleAddToCurrent(tmpl.id)} style={btnStyle(tc.accent)}>追加</button>
                        <button onClick={() => removeRegistryTemplate(tmpl.id)} style={btnStyle(tc.danger)}>削除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    );
  };

  // セクション3: 未使用のレーン
  const renderUnusedSection = () => {
    const key = 'unused';
    const isCollapsed = collapsed[key] ?? false;

    return (
      <div style={{ marginBottom: 16 }}>
        {renderSectionHeader(key, '未使用のレーン', unused.length)}
        {!isCollapsed && (
          unused.length === 0 ? (
            <div style={{ padding: '12px 8px', fontSize: 13, color: tc.textSecondary }}>該当なし</div>
          ) : (
            <table className="lane-registry-table">
              <thead>
                <tr>
                  <th>ラベル</th>
                  <th>高さ(px)</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {unused.map((tmpl) => (
                  <tr key={tmpl.id}>
                    <td>
                      <input type="text" value={tmpl.label} onChange={(e) => handleLabelChange(tmpl.id, e.target.value)} style={inputStyle} />
                    </td>
                    <td>
                      <input type="number" value={tmpl.defaultHeightPx} onChange={(e) => handleHeightChange(tmpl.id, e.target.value)} min={20} style={numberInputStyle} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleAddToCurrent(tmpl.id)} style={btnStyle(tc.accent)}>追加</button>
                        <button onClick={() => removeRegistryTemplate(tmpl.id)} style={btnStyle(tc.danger)}>削除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    );
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog lane-registry-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}
      >
        <h3 style={{ flexShrink: 0 }}>
          レーン管理: 「{currentPage?.name ?? '不明'}」
        </h3>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {renderCurrentSection()}
          {renderOtherSection()}
          {renderUnusedSection()}

          <button
            onClick={handleAddTemplate}
            style={{
              marginTop: 4, padding: '6px 16px',
              border: `1px dashed ${tc.accent}`, borderRadius: 6,
              background: 'transparent', color: tc.accent,
              cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
            }}
          >
            + 新規テンプレート追加
          </button>
        </div>

        <div className="actions" style={{ flexShrink: 0 }}>
          <button onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
