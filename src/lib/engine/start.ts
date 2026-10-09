import { start } from "workflow/api";
import { contentEngine, type EngineOptions } from "@/workflows/content-engine";
import { db } from "./db";
import type { EngineSettings } from "./settings";

/** What each quick action in /admin runs; limits come from the saved settings */
export type Preset = "full" | "discover" | "curate" | "produce" | "demo" | "preview" | "editor";

export function optionsFor(s: EngineSettings, preset: Preset, trigger: EngineOptions["trigger"]): EngineOptions {
  const L = s.limits;
  const none = { maxCurate: 0, maxProduce: 0, maxDemo: 0, maxPreview: 0, maxPages: 0 };
  const base: EngineOptions = { trigger, models: s.models, budget: s.budget, maxNew: L.maxNew, maxRefresh: L.maxRefresh };
  switch (preset) {
    case "discover":
      return { ...base, ...none, maxCurate: L.maxCurate };
    case "curate":
      return { ...base, ...none, skipScout: true, maxCurate: L.maxCurate };
    case "produce":
      return { ...base, ...none, skipScout: true, maxProduce: Math.max(L.maxProduce, 8) };
    case "demo":
      return { ...base, ...none, skipScout: true, maxDemo: Math.max(L.maxDemo, 4) };
    case "preview":
      return { ...base, ...none, skipScout: true, maxPreview: Math.max(L.maxPreview ?? 40, 10) };
    case "editor":
      return { ...base, ...none, skipScout: true, maxPages: Math.max(L.maxPages, 1) };
    default:
      return { ...base, maxCurate: L.maxCurate, maxProduce: L.maxProduce, maxDemo: L.maxDemo, maxPreview: L.maxPreview ?? 40, maxPages: L.maxPages };
  }
}

export async function startEngine(preset: Preset, trigger: EngineOptions["trigger"]) {
  const settings = await db.settings();
  const run = await start(contentEngine, [optionsFor(settings, preset, trigger)]);
  return run.runId;
}

export const vnHour = (d = new Date()) => Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" }).format(d)) % 24;
