/**
 * Paid plans are switched off while Airsc runs on Vercel's Hobby plan, which is for non-commercial use only.
 * Off: no Pricing page, no checkout, no upgrade prompts; members who already have Pro keep it.
 * Set to true (after moving the Vercel team to Pro) to bring all of it back.
 */
export const BILLING = false;
