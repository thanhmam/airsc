# X posts: how we write them

The account is small (about a hundred followers), so a post has to earn attention on its own. The method
below came from the Archify post of 22 Oct 2026, which replaced a draft that read like a product listing.
The code enforces it: `src/lib/social/rules.ts` is part of the prompts of both writers, and the three-day
review can add guidance in `/admin/social/settings` but cannot change these rules.

## Who we write for

A vibe coder or AI builder who ships fast with an agent and is starting to lose control: the scope creeps,
the architecture and the database grow one prompt at a time, and the whole product is no longer in their
head. Every post answers one question for them: **how do I keep seeing and controlling what I am building?**

## The shape of a post

1. **Hook: the builder's problem, or what changes when it is fixed.** Not the tool, not "check this out".
   "Vibe coding is fast. Keeping the whole product in your head is not."
2. **Context, one or two lines.** What happened on a real project, with a number or a date.
3. **What the resource did about it, one plain sentence.** What it reads, what it produces, where it runs.
4. **Evidence.** Before and after, with counts taken from the real output. "Oct 9: 15 parts, 14 links.
   Oct 21: 17 parts, 19 links."
5. **What changes in how the builder works, one short line.** Only when the notes support it.
6. **Credit as its own sentence:** "Built by @handle." The link goes in the first reply, never in the post.

## Rules

- **Facts only.** Every number, date and result comes from the notes or the data. Do not invent a result, a
  benefit or a feeling. A spotlight has no first-hand use behind it, so it never says "I used" or "I tried".
- **One image per post**, designed to show the change at a glance. Best is a before and after of the real
  output (see below). No "the screenshot shows" in the text.
- **Plain developer voice.** Short lines, one idea per line. English only on X. No hashtags, no emoji, no
  hype words (game-changer, supercharge, must-have, 10x), no "Here's how", no threads.
- **Tag the author** (GitHub `twitter_username`) only after you approve the post: X does not allow
  automated unsolicited mentions. An unapproved spotlight goes out without the @.
- **Applied posts never go out without your approval.**

## Applied posts: how to make one

An applied post is the strongest kind because only you can write it. Per resource:

1. Run the resource on a real project (Airsc, or a client's). Keep the output.
2. Find the evidence: two points in time you can compare (a diagram on two dates, a score before and after,
   the number of findings, tokens or minutes). Without a comparison there is no post yet.
3. Design the image (below).
4. `/admin/social/new`: pick the resource, write the notes in Vietnamese or English (the problem, what you
   did, the numbers, what you do differently now), attach the image, choose the hour.
5. Read the draft in the queue, fix any sentence that goes beyond your notes, **Approve**.

### The image

1600 × 900. A short headline that poses the builder's problem (the Archify one: "Vibe coding adds features
fast. Could you still draw your app?"), two panels labelled with the two dates and their counts, one line
under the panels with what was added and removed, and the facts that frame it (days, commits, migrations,
tables). Real output in the panels, never a mock-up. Colours and type from `BRAND.md`.

## Cadence

About one applied post and one or two spotlights a day, not three posts by the engine: on a small account
many similar posts look like a bot. The applied post is the one that counts; spotlights fill in around it.
Every three days the review (`/admin/social/reviews`) compares views and engagement with the three days
before and rewrites the guidance. With this few followers a difference of a few dozen views is noise, so
change one thing at a time.

## Worked example

```
Vibe coding is fast. Keeping the whole product in your head is not.

12 days into building Airsc, I had added payments, a daily quota, an X bot and admin routes, one prompt at
a time. I could no longer draw my own app.

So I ran Archify, a Claude Code skill, on the repo. It reads the code and draws the whole system, each box
linked to its source lines.

Oct 9: 15 parts, 14 links.
Oct 21: 17 parts, 19 links.

Now I see what a new feature touches before I let it in.

Built by @t20000622yy.
```

Reply: the resource's page on Airsc with its safety report and one-click install.

## Ideas for the next applied posts

Each needs its own before and after from Airsc itself:

| Resource | The problem | The comparison |
| --- | --- | --- |
| drawio-skill | The database grew without a plan | Table diagram on two dates |
| mcp-playwright | Nobody tested the pricing and upgrade flow on a phone | Findings found, before and after the fixes |
| Waza (`/hunt`) | A regression took too long to trace | Steps or time to the root cause |
| design-dna | The UI drifted from `BRAND.md` | Off-brand values found, before and after |
| anti-slop | Homepage copy and UI that read as AI-made | The same section, before and after |
| ccstatusline | Token use is invisible while building | Tokens per task, before and after |
