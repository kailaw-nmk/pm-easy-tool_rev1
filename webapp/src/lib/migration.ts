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

  // v3.0.0 → v3.1.0
  if (migrated.version === '3.0.0') {
    migrated = migrateV3toV31(migrated);
  }

  // v3.1.0 → v3.2.0
  if (migrated.version === '3.1.0') {
    migrated = migrateV31toV32(migrated);
  }

  return migrated;
}

function migrateV31toV32(data: ScheduleData): ScheduleData {
  const pages = data.pages.map((page) => ({
    ...page,
    scheduleLines: page.scheduleLines ?? [],
  }));
  return { ...data, version: '3.2.0', pages };
}

function migrateV3toV31(data: ScheduleData): ScheduleData {
  const pages = data.pages.map((page) => ({
    ...page,
    connections: page.connections ?? [],
  }));
  return { ...data, version: '3.1.0', pages };
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
