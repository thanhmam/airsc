import { gateway } from "ai";

/** Remaining AI Gateway balance for the team (null when unavailable) */
export async function aiCredits(): Promise<{ balance: number; used: number } | null> {
  try {
    const c = await gateway.getCredits();
    return { balance: Number(c.balance), used: Number(c.totalUsed) };
  } catch {
    return null;
  }
}
