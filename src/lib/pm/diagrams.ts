/**
 * Archify diagrams for /admin/pm/architecture. The HTML in ./diagrams is generated from the JSON in
 * ./diagrams/source with the Archify skill (`finalize … --repo-root . --quality showcase`), with source
 * links pinned to the commit in each JSON's meta.repository.revision. Regenerate after changes to the
 * request paths, the Content Engine steps or the X posting flow.
 */
export const DIAGRAMS = [
  { name: "architecture", kind: "architecture" },
  { name: "content-engine", kind: "workflow" },
  { name: "x-daily-post", kind: "sequence" },
] as const;

export type DiagramName = (typeof DIAGRAMS)[number]["name"];

/** Commit the diagrams were traced from */
export const DIAGRAM_REVISION = "aa0701e";
export const DIAGRAM_DATE = "2026-10-16";
