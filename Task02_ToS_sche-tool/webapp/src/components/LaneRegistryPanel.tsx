import { useState } from 'react';
import { useScheduleStore } from '../hooks/useScheduleStore';

interface Props {
  onClose: () => void;
}

export function LaneRegistryPanel({ onClose }: Props) {
  const { data, updateRegistryTemplate, addRegistryTemplate, removeRegistryTemplate } = useScheduleStore();
  const registry = data?.laneRegistry ?? [];

  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

  const handleLabelChange = (templateId: string, label: string) => {
    updateRegistryTemplate(templateId, { label });
  };

  const handleHeightChange = (templateId: string, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 20) {
      updateRegistryTemplate(templateId, { defaultHeightPx: num });
    }
  };

  const handleAddTag = (templateId: string) => {
    const input = tagInputs[templateId]?.trim();
    if (!input) return;
    const tmpl = registry.find((t) => t.id === templateId);
    if (!tmpl || tmpl.tags.includes(input)) return;
    updateRegistryTemplate(templateId, { tags: [...tmpl.tags, input] });
    setTagInputs((prev) => ({ ...prev, [templateId]: '' }));
  };

  const handleRemoveTag = (templateId: string, tag: string) => {
    const tmpl = registry.find((t) => t.id === templateId);
    if (!tmpl) return;
    updateRegistryTemplate(templateId, { tags: tmpl.tags.filter((t) => t !== tag) });
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
      <div className="dialog lane-registry-panel" onClick={(e) => e.stopPropagation()}>
        <h3>レーンテンプレート管理</h3>
        <table className="lane-registry-table">
          <thead>
            <tr>
              <th>ラベル</th>
              <th>タグ</th>
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
                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #ccc', borderRadius: 3, fontSize: 13, fontFamily: 'inherit' }}
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                    {tmpl.tags.map((tag) => (
                      <span key={tag} className="tag-chip">
                        {tag}
                        <button className="tag-chip-remove" onClick={() => handleRemoveTag(tmpl.id, tag)}>×</button>
                      </span>
                    ))}
                    <span className="tag-add-inline">
                      <input
                        type="text"
                        value={tagInputs[tmpl.id] ?? ''}
                        onChange={(e) => setTagInputs((prev) => ({ ...prev, [tmpl.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(tmpl.id); } }}
                        placeholder="+追加"
                        style={{ width: 60, padding: '2px 4px', border: '1px dashed #aaa', borderRadius: 3, fontSize: 11, fontFamily: 'inherit' }}
                      />
                    </span>
                  </div>
                </td>
                <td>
                  <input
                    type="number"
                    value={tmpl.defaultHeightPx}
                    onChange={(e) => handleHeightChange(tmpl.id, e.target.value)}
                    min={20}
                    style={{ width: 60, padding: '4px 6px', border: '1px solid #ccc', borderRadius: 3, fontSize: 13, fontFamily: 'inherit', textAlign: 'right' }}
                  />
                </td>
                <td>
                  <button
                    className="danger"
                    onClick={() => removeRegistryTemplate(tmpl.id)}
                    style={{ padding: '4px 10px', border: '1px solid #c62828', borderRadius: 3, background: 'transparent', color: '#c62828', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
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
          style={{ marginTop: 12, padding: '6px 16px', border: '1px dashed #1565c0', borderRadius: 4, background: 'transparent', color: '#1565c0', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
        >
          + 新規テンプレート追加
        </button>

        <div className="actions">
          <button onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}
