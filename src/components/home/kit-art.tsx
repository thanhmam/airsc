import { Check, Search } from "lucide-react";
import type { ReactNode } from "react";

/** Tiny picture of what each kit gets you; the purple detail moves when the card is hovered (.kit:hover in globals.css) */
const ART: Record<string, ReactNode> = {
  // landing page
  layout: (
    <div className="flex w-[136px] flex-col gap-2 rounded-lg border border-line-strong bg-card px-2.5 pb-[11px] pt-2">
      <div className="flex gap-[3px]">
        {[0, 1, 2].map((i) => <span key={i} className="size-1 rounded-full bg-sketch" />)}
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex flex-1 flex-col gap-[5px]">
          <div className="h-[7px] rounded bg-ink" />
          <div className="h-[5px] w-[70%] rounded-sm bg-sketch" />
          <div className="kv-pop mt-[3px] h-[11px] w-[34px] rounded bg-accent" />
        </div>
        <div className="kv-up size-10 rounded-md bg-accent-soft" />
      </div>
    </div>
  ),
  // payment card marked "Paid"
  "credit-card": (
    <div className="relative flex h-[68px] w-28 flex-col justify-between rounded-[10px] bg-[#111113] px-3 py-[11px]">
      <div className="h-[13px] w-[18px] rounded-[3px] bg-[#c8c8cd]" />
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => <span key={i} className="h-1 w-4 rounded-sm bg-[#8c8a83]" />)}
      </div>
      <div className="kv-pop absolute -bottom-[9px] -right-4 flex h-[22px] items-center gap-1 rounded-full bg-safe-soft px-[9px] text-[11px] font-semibold text-safe">
        <Check className="size-[11px]" strokeWidth={3} />
        <span>Paid</span>
      </div>
    </div>
  ),
  // sign-in form
  lock: (
    <div className="flex w-[116px] flex-col gap-1.5 rounded-lg border border-line-strong bg-card p-2.5">
      <div className="flex h-[15px] items-center rounded border border-line-strong px-[5px]">
        <span className="h-1 w-[55%] rounded-sm bg-sketch" />
      </div>
      <div className="flex h-[15px] items-center gap-[3px] rounded border border-line-strong px-[5px]">
        {[0, 1, 2, 3, 4].map((i) => <span key={i} className="size-1 rounded-full bg-ink" />)}
      </div>
      <div className="kv-pop h-[15px] rounded bg-accent" />
    </div>
  ),
  // data table with a highlighted row
  database: (
    <div className="w-[136px] overflow-hidden rounded-lg border border-line-strong bg-card">
      {["head", "row", "hit", "row"].map((k, i) => (
        <div
          key={i}
          className={`grid grid-cols-[1fr_1.4fr_1fr] gap-2 px-[9px] py-[7px] ${k === "head" ? "bg-[#111113]" : k === "hit" ? "bg-accent-soft" : ""}`}
        >
          {[0, 1, 2].map((j) => (
            <span
              key={j}
              className={`h-1 rounded-sm ${k === "head" ? "bg-white" : k === "hit" ? "bg-accent" : "bg-sketch"} ${k === "hit" && j === 1 ? "kv-fill" : ""}`}
            />
          ))}
        </div>
      ))}
    </div>
  ),
  // search results with us at #1
  search: (
    <div className="flex w-[136px] flex-col gap-1.5">
      <div className="flex h-5 items-center gap-1.5 rounded-full border border-line-strong bg-card px-2">
        <Search className="size-2.5 text-muted" strokeWidth={3} />
        <span className="h-1 w-[48%] rounded-sm bg-ink" />
      </div>
      <div className="kv-up flex items-center gap-[7px] rounded-md border border-accent bg-card px-2 py-1.5">
        <span className="font-mono text-[9px] font-medium leading-none text-accent">1</span>
        <span className="h-[5px] flex-1 rounded-sm bg-accent" />
      </div>
      {[72, 54].map((w, i) => (
        <div key={i} className="flex items-center gap-[7px] px-[9px]">
          <span className="font-mono text-[9px] leading-none text-muted">{i + 2}</span>
          <span className="h-1 rounded-sm bg-sketch" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  ),
  // deploy bar going live
  rocket: (
    <div className="flex w-[136px] flex-col gap-[9px] rounded-lg bg-[#0f0f14] px-3 pb-3 pt-[11px]">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] leading-none text-[#a99bff]">$</span>
        <span className="h-1 w-[46%] rounded-sm bg-[#e8e8ee]" />
      </div>
      <div className="h-1.5 overflow-hidden rounded-[3px] bg-[#2a2838]">
        <div className="kv-fill h-full rounded-[3px] bg-[#8f7bff]" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="a-pulse size-1.5 rounded-full bg-[#4cc58a]" />
        <span className="font-mono text-[9.5px] leading-none text-[#4cc58a]">live</span>
      </div>
    </div>
  ),
  // inbox with a new message
  mail: (
    <div className="relative flex w-[132px] flex-col rounded-lg border border-line-strong bg-card">
      {[
        ["bg-accent", "bg-ink", 60, 88],
        ["bg-sketch", "bg-muted/60", 46, 74],
        ["bg-sketch", "bg-muted/60", 52, 66],
      ].map(([dot, head, w1, w2], i) => (
        <div key={i} className={`flex items-center gap-[7px] px-[9px] py-[7px] ${i ? "border-t border-line" : ""}`}>
          <span className={`size-3 flex-none rounded-full ${dot}`} />
          <div className="flex flex-1 flex-col gap-[3px]">
            <span className={`h-1 rounded-sm ${head}`} style={{ width: `${w1}%` }} />
            <span className="h-[3px] rounded-sm bg-sketch" style={{ width: `${w2}%` }} />
          </div>
        </div>
      ))}
      <span className="kv-pop absolute -right-2 -top-2 grid size-[18px] place-items-center rounded-full bg-accent text-[10px] font-semibold leading-none text-accent-fg">
        1
      </span>
    </div>
  ),
  // bar chart
  chart: (
    <div className="flex h-[66px] items-end gap-[7px] border-b-2 border-ink px-1.5">
      {[20, 34, 26, 44, 36, 54].map((h, i) => (
        <div key={i} className={`kv-grow w-3.5 rounded-t-[3px] ${i === 5 ? "bg-accent" : "bg-ink"}`} style={{ height: h }} />
      ))}
    </div>
  ),
  // chat bubbles, agent typing
  bot: (
    <div className="flex w-[132px] flex-col gap-[7px]">
      <div className="flex w-[84px] flex-col gap-1 self-start rounded-[10px_10px_10px_3px] border border-line-strong bg-card px-[9px] py-2">
        <span className="h-1 rounded-sm bg-ink" />
        <span className="h-1 w-[60%] rounded-sm bg-sketch" />
      </div>
      <div className="kv-up flex items-center gap-1 self-end rounded-[10px_10px_3px_10px] bg-accent px-3 py-2.5">
        {[0, 1, 2].map((i) => <span key={i} className="kv-dot size-[5px] rounded-full bg-white" />)}
      </div>
    </div>
  ),
  // colour palette + components
  palette: (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        <span className="size-[22px] rounded-full bg-ink" />
        <span className="kv-pop size-[22px] rounded-full bg-accent" />
        <span className="size-[22px] rounded-full border border-line-strong bg-accent-soft" />
        <span className="size-[22px] rounded-full border border-line-strong bg-card" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-4 w-[42px] rounded-[5px] bg-accent" />
        <span className="h-4 w-[42px] rounded-[5px] border-[1.5px] border-ink" />
        <span className="relative h-3.5 w-[26px] rounded-[7px] bg-ink">
          <span className="absolute right-0.5 top-0.5 size-2.5 rounded-full bg-bg" />
        </span>
      </div>
    </div>
  ),
};

export function KitArt({ icon }: { icon: string }) {
  return (
    <div aria-hidden className="flex h-[104px] items-center justify-center overflow-hidden rounded-[10px] bg-art">
      {ART[icon] ?? ART.layout}
    </div>
  );
}
