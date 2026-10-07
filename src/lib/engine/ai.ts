import { generateText, Output } from "ai";
import type { z } from "zod";

/**
 * Model tiers for the content agents. Each tier falls back to AIRSC_MODEL_FALLBACK
 * when the primary model is unavailable (e.g. AI Gateway has no paid credits yet).
 */
export const MODELS = {
  fast: () => process.env.AIRSC_MODEL_FAST ?? "anthropic/claude-sonnet-5.5",
  smart: () => process.env.AIRSC_MODEL_SMART ?? "anthropic/claude-opus-5.5",
  fallback: () => process.env.AIRSC_MODEL_FALLBACK ?? process.env.AIRSC_ENRICH_MODEL ?? "google/gemini-2.5-flash",
};

const unavailable = (e: unknown) =>
  /free tier|do not have access|not found|insufficient|credit|unauthorized|forbidden/i.test(String((e as Error)?.message ?? e));

export async function generateObject<T>(opts: {
  tier: keyof Omit<typeof MODELS, "fallback">;
  /** model chosen in /admin settings; falls back to the tier default */
  model?: string;
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
}): Promise<{ object: T; model: string; cost: number; inputTokens: number; outputTokens: number }> {
  const models = [opts.model || MODELS[opts.tier](), MODELS.fallback()].filter((m, i, a) => a.indexOf(m) === i);
  let lastError: unknown;
  for (const model of models) {
    try {
      const { output, usage, providerMetadata } = await generateText({
        model,
        output: Output.object({ schema: opts.schema }),
        system: opts.system,
        prompt: opts.prompt,
      });
      // AI Gateway reports the billed USD cost of each call
      const cost = Number((providerMetadata?.gateway as { cost?: string } | undefined)?.cost ?? 0);
      return {
        object: output as T,
        model,
        cost,
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
      };
    } catch (e) {
      lastError = e;
      if (!unavailable(e)) throw e;
    }
  }
  throw lastError;
}
