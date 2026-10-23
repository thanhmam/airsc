import snapshots from "./diagrams/snapshots.json";

/**
 * Archify diagrams for /admin/pm/architecture, kept as dated snapshots so the history of the system stays
 * visible. Each snapshot is a folder in ./diagrams/snapshots/<id>/ with one self-contained HTML per diagram
 * and the Archify JSON it was rendered from in source/. A refresh adds a new snapshot at the top of
 * ./diagrams/snapshots.json and never edits or deletes an older one. How to refresh: docs/architecture-snapshots.md
 * (the /refresh-architecture command, or the "Update architecture" button in the admin).
 */
export type L = { en: string; vi: string };
export type DiagramKind = "architecture" | "workflow" | "sequence" | "dataflow" | "lifecycle";
export type DiagramInfo = { name: string; kind: DiagramKind; title: L; desc: L };
export type Snapshot = {
  /** folder name: <YYYY-MM-DD>-<short commit> */
  id: string;
  date: string;
  /** commit the diagrams were traced from; the admin counts the changes after it */
  revision: string;
  note: L;
  diagrams: DiagramInfo[];
};

/** Newest first */
export const SNAPSHOTS = snapshots as Snapshot[];
export const LATEST = SNAPSHOTS[0];

export const snapshotById = (id: string | null | undefined) => SNAPSHOTS.find((s) => s.id === id) ?? LATEST;
