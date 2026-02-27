import type { ScheduleData, LaneTemplate } from '../types/schedule';

/**
 * Migrate schedule data through versions.
 * v1.0.0 → v2.0.0: optional fields (tooltip, memo, minHeightPx)
 * v2.0.0 → v3.0.0: laneRegistry, tags, registryId on swimLanes
 */
export function migrateData(data: ScheduleData): ScheduleData {
  let migrated = { ...data };

  // v1 → v2
  if (migrated.version === '1.0.0') {
    migrated = { ...migrated, version: '2.0.0' };
  }

  // v2 → v3
  if (migrated.version === '2.0.0') {
    migrated = migrateV2toV3(migrated);
  }

  return migrated;
}

function migrateV2toV3(data: ScheduleData): ScheduleData {
  // Build lane registry from all pages' lanes, deduplicating by label
  const labelMap = new Map<string, LaneTemplate>();

  for (const page of data.pages) {
    for (const lane of page.swimLanes) {
      if (!labelMap.has(lane.label)) {
        labelMap.set(lane.label, {
          id: `tmpl_${labelMap.size}`,
          label: lane.label,
          tags: [],  // no tags initially → appears in all views
          defaultHeightPx: lane.heightPx,
        });
      }
    }
  }

  const laneRegistry = Array.from(labelMap.values());

  // Assign registryId and tags to each swim lane
  const pages = data.pages.map((page) => ({
    ...page,
    swimLanes: page.swimLanes.map((lane) => {
      const tmpl = labelMap.get(lane.label);
      return {
        ...lane,
        registryId: tmpl?.id,
        tags: lane.tags ?? [],
      };
    }),
  }));

  return {
    ...data,
    version: '3.0.0',
    laneRegistry,
    pages,
  };
}
