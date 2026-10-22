/**
 * The fixed writing rules every X post follows (docs/x-posts.md has the reasoning and the worked example).
 * They are part of the prompts of the spotlight and applied writers; the three-day review can add to the
 * guidance in /admin/social, but it cannot change these.
 */
export const POST_RULES = `Fixed rules for every post:
1. Start from the builder's problem, not the tool. The reader is a vibe coder or AI builder shipping fast with an agent, and the problem is losing control: scope creeps, the architecture and the database grow without a plan, and the whole product is no longer in their head. Open with that situation, or with what changes when it is fixed. The resource comes second.
2. Say in one plain sentence what the resource does about that problem: what it reads, what it produces, where it runs.
3. Evidence is numbers and before/after taken from the data or notes you are given (counts, dates, what was added or removed). Never invent a number, a result, a feeling or a benefit. Without evidence, state what the resource does and stop; do not claim results.
4. Close with what changes in how the builder works, one short line, only when the notes or data support it.
5. Credit the author as its own short sentence ("Built by @handle."). No link in the post (the link goes in the first reply), no hashtags, no emoji, no hype words.
6. One image per post. Say nothing about "the screenshot" or "the image".
7. Plain developer voice, short lines, one idea per line, the way a builder talks to other builders.`;
