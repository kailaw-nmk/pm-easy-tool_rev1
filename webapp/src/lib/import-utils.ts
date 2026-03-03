import type { SchedulePage, LaneTemplate } from '../types/schedule';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Deep-copy pages and regenerate all entity IDs.
 * Internal references (Connection fromItemId/toLaneId, ScheduleLine sourceItemId/sourceLaneId)
 * are remapped via a lookup table.
 */
export function remapPageIds(pages: SchedulePage[]): SchedulePage[] {
  const idMap = new Map<string, string>();

  const remap = (oldId: string, prefix: string): string => {
    if (!idMap.has(oldId)) {
      idMap.set(oldId, generateId(prefix));
    }
    return idMap.get(oldId)!;
  };

  const cloned: SchedulePage[] = JSON.parse(JSON.stringify(pages));

  for (const page of cloned) {
    page.id = remap(page.id, 'page');

    for (const lane of page.swimLanes) {
      lane.id = remap(lane.id, 'lane');
      for (const bar of lane.bars) {
        bar.id = remap(bar.id, 'bar');
      }
      for (const ms of lane.milestones) {
        ms.id = remap(ms.id, 'ms');
      }
    }

    for (const ann of page.annotations) {
      ann.id = remap(ann.id, 'ann');
    }

    if (page.connections) {
      for (const conn of page.connections) {
        conn.id = remap(conn.id, 'conn');
        conn.fromItemId = idMap.get(conn.fromItemId) ?? conn.fromItemId;
        conn.fromLaneId = idMap.get(conn.fromLaneId) ?? conn.fromLaneId;
        conn.toItemId = idMap.get(conn.toItemId) ?? conn.toItemId;
        conn.toLaneId = idMap.get(conn.toLaneId) ?? conn.toLaneId;
      }
    }

    if (page.scheduleLines) {
      for (const sl of page.scheduleLines) {
        sl.id = remap(sl.id, 'sl');
        sl.sourceItemId = idMap.get(sl.sourceItemId) ?? sl.sourceItemId;
        sl.sourceLaneId = idMap.get(sl.sourceLaneId) ?? sl.sourceLaneId;
      }
    }
  }

  return cloned;
}

/**
 * Merge imported lane templates into an existing registry.
 * - Label match → reuse existing template ID, add page names to tags
 * - No match → add as new template with a fresh ID
 *
 * Returns the merged registry and a remap table (old imported ID → existing/new ID).
 */
export function mergeLaneRegistry(
  existing: LaneTemplate[],
  imported: LaneTemplate[],
  importedPages: SchedulePage[],
): { mergedRegistry: LaneTemplate[]; registryIdRemap: Map<string, string> } {
  const merged = existing.map((t) => ({ ...t, tags: [...t.tags] }));
  const registryIdRemap = new Map<string, string>();

  // Collect page names that reference each imported template
  const pageNamesForTemplate = new Map<string, string[]>();
  for (const page of importedPages) {
    for (const lane of page.swimLanes) {
      if (lane.registryId) {
        if (!pageNamesForTemplate.has(lane.registryId)) {
          pageNamesForTemplate.set(lane.registryId, []);
        }
        const names = pageNamesForTemplate.get(lane.registryId)!;
        if (!names.includes(page.name)) {
          names.push(page.name);
        }
      }
    }
  }

  for (const imp of imported) {
    const match = merged.find((t) => t.label === imp.label);
    if (match) {
      // Reuse existing template — add imported page names to tags
      registryIdRemap.set(imp.id, match.id);
      const pageNames = pageNamesForTemplate.get(imp.id) ?? [];
      for (const pn of pageNames) {
        if (!match.tags.includes(pn)) {
          match.tags.push(pn);
        }
      }
    } else {
      // New template
      const newId = generateId('tmpl');
      registryIdRemap.set(imp.id, newId);
      const pageNames = pageNamesForTemplate.get(imp.id) ?? [];
      merged.push({
        id: newId,
        label: imp.label,
        tags: pageNames,
        defaultHeightPx: imp.defaultHeightPx,
      });
    }
  }

  return { mergedRegistry: merged, registryIdRemap };
}

/**
 * Update registryId on all lanes in the given pages according to the remap table.
 */
export function applyRegistryIdRemap(
  pages: SchedulePage[],
  registryIdRemap: Map<string, string>,
): void {
  for (const page of pages) {
    for (const lane of page.swimLanes) {
      if (lane.registryId && registryIdRemap.has(lane.registryId)) {
        lane.registryId = registryIdRemap.get(lane.registryId)!;
      }
    }
  }
}
