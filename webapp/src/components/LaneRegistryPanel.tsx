import { useScheduleStore } from '../hooks/useScheduleStore';
import { useThemeColors } from '../hooks/useThemeColors';

interface Props {
  onClose: () => void;
}

export function LaneRegistryPanel({ onClose }: Props) {
  const { data, updateRegistryTemplate, addRegistryTemplate, removeRegistryTemplate, addLaneFromTemplate, removeLane } = useScheduleStore();
  const tc = useThemeColors();
  const registry = data?.laneRegistry ?? [];
  const pages = data?.pages ?? [];

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

  const handleAddTemplate = () => {
    addRegistryTemplate({
      id: `tmpl_${Date.now()}`,
      label: '新規レーン',
      tags: [],
      defaultHeightPx: 80,
    });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog lane-registry-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}
      >
        <h3 style={{ flexShrink: 0 }}>レーンテンプレート管理</h3>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
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
              {registry.map((tmpl) => (
                <tr key={tmpl.id}>
                  <td>
                    <input
                      type="text"
                      value={tmpl.label}
                      onChange={(e) => handleLabelChange(tmpl.id, e.target.value)}
                      style={{
                        width: '100%', padding: '4px 6px',
                        border: `1px solid ${tc.inputBorder}`, borderRadius: 4,
                        fontSize: 13, fontFamily: 'inherit',
                        background: tc.inputBg, color: tc.textPrimary,
                      }}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', alignItems: 'center' }}>
                      {pages.map((page) => (
                        <label
                          key={page.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                            color: tc.textPrimary,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isTemplateInPage(tmpl.id, page.id)}
                            onChange={(e) => handleToggleSchedule(tmpl.id, page.id, e.target.checked)}
                            style={{ accentColor: tc.accent }}
                          />
                          {page.name}
                        </label>
                      ))}
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={tmpl.defaultHeightPx}
                      onChange={(e) => handleHeightChange(tmpl.id, e.target.value)}
                      min={20}
                      style={{
                        width: 60, padding: '4px 6px',
                        border: `1px solid ${tc.inputBorder}`, borderRadius: 4,
                        fontSize: 13, fontFamily: 'inherit', textAlign: 'right',
                        background: tc.inputBg, color: tc.textPrimary,
                      }}
                    />
                  </td>
                  <td>
                    <button
                      className="danger"
                      onClick={() => removeRegistryTemplate(tmpl.id)}
                      style={{
                        padding: '4px 10px',
                        border: `1px solid ${tc.danger}`, borderRadius: 4,
                        background: 'transparent', color: tc.danger,
                        cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                      }}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleAddTemplate}
            style={{
              marginTop: 12, padding: '6px 16px',
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
