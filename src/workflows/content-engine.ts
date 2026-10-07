import { getWorkflowMetadata } from "workflow";
import { GitHub } from "@/lib/crawler/github";
import { KITS, pickKitMembers } from "@/lib/crawler/kits";
import { analyse, pool, type Row } from "@/lib/crawler/run";
import { aiCredits } from "@/lib/engine/credits";
import { db } from "@/lib/engine/db";
import { curate } from "@/lib/engine/agents/curator";
import { demoable, demoMcp } from "@/lib/engine/agents/demo";
import { categoryGuide, isoWeek, weeklyDigest } from "@/lib/engine/agents/editor";
import { produce } from "@/lib/engine/agents/producer";
import { discover, metadata } from "@/lib/engine/agents/scout";
import { chunks, select, type Candidate } from "@/lib/engine/select";
import { anonClient } from "@/lib/supabase/anon";
import { CATEGORIES } from "@/lib/taxonomy";
import type { Resource } from "@/lib/types";

export type EngineOptions = {
  trigger?: "cron" | "manual" | "backfill";
  skipScout?: boolean;
  maxNew?: number;
  maxRefresh?: number;
  maxCurate?: number;
  maxProduce?: number;
  maxDemo?: number;
  maxPages?: number;
  models?: { curator?: string; producer?: string; editor?: string };
  budget?: { run_usd?: number; min_balance_usd?: number };
};

/**
 * Airsc Content Engine. Runs daily (and on demand from /admin):
 * Scout → Analyst → Curator → kits → Producer → Demo → Editor.
 * Every step is retried and checkpointed, so a failure resumes where it stopped.
 */
export async function contentEngine(opts: EngineOptions = {}) {
  "use workflow";
  const { workflowRunId } = getWorkflowMetadata();
  const logId = await startRun(workflowRunId, opts.trigger ?? "cron");
  const stats: Record<string, number> = {};
  const add = (k: string, n: number) => (stats[k] = (stats[k] ?? 0) + n);

  try {
    if (!opts.skipScout) {
      const found = await discoverStep(logId);
      const candidates = [...found.withRepo];
      for (const batch of chunks(found.named.slice(0, 1000), 250)) candidates.push(...(await metadataStep(batch)));
      const { fresh, refresh } = select(candidates, opts.maxNew ?? 150, opts.maxRefresh ?? 150);
      add("discovered_new", fresh.length);
      add("refresh", refresh.length);
      for (const batch of chunks([...fresh, ...refresh], 20)) add("analysed", await analyzeStep(batch));
    }

    // Budget brake: skip AI agents when the AI Gateway balance is low, stop when this run hits its cap
    const runCap = opts.budget?.run_usd ?? 2;
    const balance = await balanceStep();
    const aiAllowed = balance === null || balance >= (opts.budget?.min_balance_usd ?? 1);
    const overBudget = () => (stats.cost_usd ?? 0) >= runCap;
    if (!aiAllowed) await logStep(logId, `budget · AI balance $${balance?.toFixed(2)} is under the minimum: AI agents skipped`);
    let braked = false;
    const brake = async () => {
      if (!overBudget()) return false;
      if (!braked) await logStep(logId, `budget · run cap $${runCap} reached: remaining AI work deferred to the next run`);
      braked = true;
      return true;
    };

    if (aiAllowed) {
      for (const batch of chunks(await listStep("unclassified", opts.maxCurate ?? 300), 10)) {
        if (await brake()) break;
        const r = await curateStep(logId, batch, opts.models?.curator);
        Object.entries(r).forEach(([k, v]) => add(k, v));
      }
    }
    await kitsStep(logId);

    if (aiAllowed && (opts.maxProduce ?? 60) > 0) {
      const toProduce = await listStep("unproduced", opts.maxProduce ?? 60);
      for (const [i, batch] of chunks(toProduce, 4).entries()) {
        if (await brake()) break;
        // the most-starred resources get the stronger model unless a model is pinned in settings
        const r = await produceStep(logId, batch, i < 3 ? "smart" : "fast", opts.models?.producer);
        add("produced", r.produced);
        add("cost_usd", r.cost_usd);
        add("cost_producer", r.cost_usd);
      }
    }

    if ((opts.maxDemo ?? 20) > 0) {
      for (const batch of chunks(await listStep("undemoed", opts.maxDemo ?? 20), 4)) {
        const results = await Promise.allSettled(batch.map((name) => demoStep(name)));
        add("demos_verified", results.filter((r) => r.status === "fulfilled" && r.value).length);
        add("demos_tried", batch.length);
      }
    }

    if (aiAllowed && (opts.maxPages ?? 5) > 0) {
      for (const task of await editorPlanStep(opts.maxPages ?? 5)) {
        if (await brake()) break;
        const r = await editorWriteStep(logId, task, opts.models?.editor);
        add("pages", r.pages);
        add("cost_usd", r.cost_usd);
        add("cost_editor", r.cost_usd);
      }
    }

    await finishRun(logId, "completed", stats);
  } catch (e) {
    await finishRun(logId, "failed", stats, String((e as Error)?.message ?? e));
    throw e;
  }
  return stats;
}

// ---------------------------------------------------------------- steps

async function startRun(runId: string, trigger: string) {
  "use step";
  return db.logRun(null, { run_id: runId, trigger });
}

async function log(logId: number, msg: string) {
  await db.logRun(logId, { log: [{ at: new Date().toISOString(), msg }] }).catch(() => {});
}

async function discoverStep(logId: number) {
  "use step";
  const lines: string[] = [];
  const r = await discover({ log: (m) => lines.push(m) });
  await log(logId, `scout · ${lines.join(" · ")}`);
  return r;
}

async function metadataStep(batch: Parameters<typeof metadata>[0]) {
  "use step";
  return metadata(batch);
}

async function analyzeStep(batch: Candidate[]) {
  "use step";
  const gh = new GitHub();
  const rows = (await pool(batch, 6, (c) => analyse(gh, c.repo, c.type).catch(() => null))).filter((r): r is Row => !!r);
  if (!rows.length) return 0;
  await db.ingest(rows);
  const sources = new Map(batch.map((c) => [c.repo.full_name, c.sources]));
  await db.patch(rows.map((r) => ({ full_name: r.full_name, sources: sources.get(r.full_name) ?? [] })));
  return rows.length;
}

async function listStep(filter: "unclassified" | "unproduced" | "undemoed", limit: number) {
  "use step";
  return (await db.list(filter, limit)).map((r) => r.full_name);
}

async function curateStep(logId: number, names: string[], model?: string) {
  "use step";
  const rows = await db.byNames(names);
  try {
    const { results, model: used, cost } = await curate(rows, model);
    await db.patch(
      results.map(({ key, relevant: _relevant, ...rest }) => ({ full_name: key, ...rest })),
    );
    const count = (s: string) => results.filter((r) => r.status === s).length;
    await log(logId, `curator(${used}) · ${results.length} items · published ${count("published")} · hidden ${count("hidden")} · $${cost.toFixed(4)}`);
    return { curated: results.length, published: count("published"), hidden: count("hidden"), cost_usd: cost, cost_curator: cost };
  } catch (e) {
    await log(logId, `curator batch failed: ${(e as Error).message.slice(0, 200)}`);
    return { curate_failed: names.length };
  }
}

async function kitsStep(logId: number) {
  "use step";
  const all: Pick<Resource, "full_name" | "name" | "description" | "topics" | "stars" | "safety" | "type">[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await anonClient()
      .from("resources")
      .select("full_name,name,description,topics,stars,safety,type")
      .order("full_name")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    all.push(...data);
    if (data.length < 1000) break;
  }
  const kits = KITS.map((k, position) => ({ ...k, position, resources: pickKitMembers(k, all) }));
  await db.ingestKits(kits);
  await log(logId, `kits rebuilt from ${all.length} published resources`);
}

async function produceStep(logId: number, names: string[], tier: "fast" | "smart", modelId?: string) {
  "use step";
  const rows = await db.byNames(names);
  try {
    const { items, model, cost } = await produce(rows, tier, modelId);
    await db.patch(items.map((i) => ({ full_name: i.full_name, showcase: i.showcase, prompts: i.prompts })));
    await log(logId, `producer(${model}) · ${items.length} showcases · $${cost.toFixed(4)}`);
    return { produced: items.length, cost_usd: cost };
  } catch (e) {
    await log(logId, `producer batch failed: ${(e as Error).message.slice(0, 200)}`);
    return { produced: 0, cost_usd: 0 };
  }
}

async function demoStep(name: string) {
  "use step";
  const [r] = await db.byNames([name]);
  if (!r) return false;
  const demo = demoable(r)
    ? await demoMcp(r)
    : { kind: "mcp_tools", ok: false, error: "needs credentials or a local app", verified_at: new Date().toISOString() };
  await db.patch([{ full_name: name, demo }]);
  return demo.ok;
}
demoStep.maxRetries = 1;

type EditorTask = { kind: "category"; category: string } | { kind: "digest" };

async function editorPlanStep(maxPages: number): Promise<EditorTask[]> {
  "use step";
  const sb = anonClient();
  const { data: pages } = await sb.from("pages").select("slug,generated_at");
  const age = new Map((pages ?? []).map((p) => [p.slug, new Date(p.generated_at).getTime()]));
  const tasks: (EditorTask & { age: number })[] = [];

  for (const c of CATEGORIES) {
    const { count } = await sb.from("resources").select("id", { count: "exact", head: true }).eq("category", c.slug);
    const generated = age.get(`best-${c.slug}`) ?? 0;
    // refresh a category page every 7 days
    if ((count ?? 0) >= 3 && Date.now() - generated > 7 * 86_400_000) tasks.push({ kind: "category", category: c.slug, age: generated });
  }
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { count: fresh } = await sb.from("resources").select("id", { count: "exact", head: true }).gte("first_seen_at", since);
  const digestAge = age.get(`new-${isoWeek().label}`) ?? 0;
  const ordered = tasks.sort((a, b) => a.age - b.age).slice(0, maxPages);
  // the digest is refreshed daily during the week
  if ((fresh ?? 0) >= 3 && Date.now() - digestAge > 20 * 3_600_000) ordered.unshift({ kind: "digest", age: digestAge });
  return ordered.map(({ age: _age, ...t }) => t);
}

async function editorWriteStep(logId: number, task: EditorTask, modelId?: string) {
  "use step";
  const sb = anonClient();
  try {
    let result;
    if (task.kind === "category") {
      const { data } = await sb
        .from("resources")
        .select("*")
        .eq("category", task.category)
        .neq("safety", "danger")
        .order("quality", { ascending: false, nullsFirst: false })
        .order("stars", { ascending: false })
        .limit(16);
      result = await categoryGuide(task.category, (data ?? []) as Resource[], modelId);
    } else {
      const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const { data } = await sb
        .from("resources")
        .select("*")
        .gte("first_seen_at", since)
        .order("quality", { ascending: false, nullsFirst: false })
        .order("stars", { ascending: false })
        .limit(16);
      result = await weeklyDigest((data ?? []) as Resource[], modelId);
    }
    const { page, cost } = result;
    await db.upsertPages([page]);
    await log(logId, `editor(${page.showcase.model}) · /guides/${page.slug} · $${cost.toFixed(4)}`);
    return { pages: 1, cost_usd: cost };
  } catch (e) {
    await log(logId, `editor ${task.kind} failed: ${(e as Error).message.slice(0, 200)}`);
    return { pages: 0, cost_usd: 0 };
  }
}

async function balanceStep() {
  "use step";
  return (await aiCredits())?.balance ?? null;
}

async function logStep(logId: number, msg: string) {
  "use step";
  await log(logId, msg);
}

async function finishRun(logId: number, status: "completed" | "failed", stats: Record<string, number>, error?: string) {
  "use step";
  await db.logRun(logId, { status, stats, ...(error ? { log: [{ at: new Date().toISOString(), msg: `error: ${error}` }] } : {}) });
}
