"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SAFETY_ICON, TYPE_ICON } from "@/components/icons";
import { SafePill } from "@/components/home/hero-search";
import { href, type Locale } from "@/lib/i18n";
import type { ResourceType, Safety } from "@/lib/types";
import { cn, compact } from "@/lib/utils";

export type SceneKind = "slides" | "diagram" | "browser" | "plan";

export type Pick = {
  slug: string;
  name: string;
  owner: string;
  type: ResourceType;
  safety: Safety;
  stars: number;
  license: string | null;
  blurb: string;
  prompt: string;
  scene: SceneKind;
  cmds: string[];
};

export type PicksCopy = {
  tabResult: string;
  tabInstall: string;
  walkNote: string;
  installNote: string;
  installed: string;
  getResource: string;
  copyPrompt: string;
  copied: string;
  noLicense: string;
  browse: string;
  types: Record<string, string>;
  safety: Record<string, string>;
};

const DARK_SAFE: Record<Safety, string> = { safe: "text-[#4cc58a]", caution: "text-[#f0a843]", danger: "text-[#f2686d]" };
const TICK = 5600;

/** Four curated picks on the left, an animated "what you get" stage on the right; auto-advances until touched */
export function TodaysPicks({ lang, picks, c }: { lang: Locale; picks: Pick[]; c: PicksCopy }) {
  const [pick, setPick] = useState(0);
  const [tab, setTab] = useState<"result" | "install">("result");
  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a media query after mount
    setReduce(mq.matches);
  }, []);

  const auto = !touched && tab === "result" && !reduce;
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setPick((p) => (p + 1) % picks.length), TICK);
    return () => clearInterval(id);
  }, [auto, picks.length]);

  if (!picks.length) return null;
  const cur = picks[pick];
  const choose = (i: number) => {
    setPick(i);
    setTab("result");
    setTouched(true);
  };

  return (
    <div className="flex flex-wrap overflow-hidden rounded-[20px] border border-line-strong bg-card shadow-[0_1px_0_rgba(17,17,19,0.04),0_28px_64px_-36px_rgba(17,17,19,0.3)]">
      <div className="flex min-w-0 flex-[1_1_380px] flex-col border-line md:border-r">
        {picks.map((p, i) => {
          const TypeIcon = TYPE_ICON[p.type];
          const on = i === pick;
          return (
            <button
              key={p.slug}
              type="button"
              aria-current={on}
              onClick={() => choose(i)}
              onMouseEnter={() => !on && choose(i)}
              className={cn(
                "relative flex w-full gap-3.5 border-b border-line px-5 py-4 text-left transition-colors",
                on ? "bg-accent-soft" : "hover:bg-soft",
              )}
            >
              <span className={cn("w-5 flex-none pt-0.5 font-mono text-xs", on ? "text-accent" : "text-muted")}>0{i + 1}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate text-[15px] font-semibold leading-5 tracking-tight">{p.name}</span>
                  <span className="truncate text-[13px] text-muted">{p.owner}</span>
                  <span className="ml-auto flex-none font-mono text-xs text-muted">★ {compact(p.stars)}</span>
                </span>
                <span className="line-clamp-2 text-[13px] leading-[19px] text-muted">{p.blurb}</span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-flex h-[22px] items-center gap-[5px] rounded-full bg-soft px-2 text-xs font-medium">
                    <TypeIcon className="size-[13px]" aria-hidden />
                    {c.types[p.type]}
                  </span>
                  <SafePill safety={p.safety} label={c.safety[p.safety]} Icon={SAFETY_ICON[p.safety]} />
                </span>
              </span>
              {auto && on && <span key={pick} aria-hidden className="a-fill absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}
            </button>
          );
        })}
        <div className="mt-auto flex min-h-12 items-center px-5">
          <Link href={href(lang, "/browse")} className="inline-flex h-11 items-center gap-1.5 text-sm font-medium text-accent">
            {c.browse} <ArrowRight className="size-[15px]" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="flex min-w-0 flex-[999_1_520px] flex-col bg-[#0f0f14] text-[#e8e8ee]">
        <div className="flex min-h-[55px] items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
          <div className="flex gap-1">
            {(["result", "install"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={tab === k}
                onClick={() => {
                  setTab(k);
                  setTouched(true);
                }}
                className={cn(
                  "h-[34px] rounded-lg px-3.5 text-[13.5px] font-medium transition-colors",
                  tab === k ? "bg-white/12 text-white" : "text-[#b4b3bd] hover:text-white",
                )}
              >
                {k === "result" ? c.tabResult : c.tabInstall}
              </button>
            ))}
          </div>
          <span className="ml-auto min-w-0 truncate font-mono text-xs text-[#a3a0b5]">
            {cur.owner}/{cur.name}
          </span>
        </div>

        <div key={`${pick}-${tab}`} className="flex min-h-[336px] flex-1 flex-col gap-3.5 px-5 pb-3.5 pt-4">
          {tab === "result" ? <Scene kind={cur.scene} lang={lang} /> : <Install cmds={cur.cmds} c={c} />}
        </div>
        {tab === "result" && <p className="px-5 pb-3 text-xs text-[#a3a0b5]">{c.walkNote}</p>}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 py-3.5 pl-5 pr-4">
          <div className="min-w-0 flex-[1_1_260px]">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="text-base font-semibold tracking-tight text-white">{cur.name}</span>
              <span className={cn("inline-flex items-center gap-1 text-xs font-medium", DARK_SAFE[cur.safety])}>
                {(() => {
                  const I = SAFETY_ICON[cur.safety];
                  return <I className="size-[13px]" aria-hidden />;
                })()}
                {c.safety[cur.safety]}
              </span>
              <span className="font-mono text-xs text-[#a3a0b5]">
                {[c.types[cur.type], cur.license || c.noLicense, `★ ${compact(cur.stars)}`].join(" · ")}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-[13.5px] leading-[1.45] text-[#b4b3bd]">{cur.blurb}</p>
          </div>
          <div className="flex flex-none gap-2">
            <Link
              href={href(lang, `/r/${cur.slug}`)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#8f7bff] px-4 text-[14.5px] font-semibold text-[#0b0b0d] hover:opacity-90"
            >
              {c.getResource} <ArrowRight className="size-[15px]" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={async () => {
                setTouched(true);
                try {
                  await navigator.clipboard.writeText(cur.prompt);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                } catch {}
              }}
              className="h-11 rounded-xl border border-white/25 px-3.5 text-[14.5px] font-medium hover:border-white/50"
            >
              {copied ? c.copied : c.copyPrompt}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Install({ cmds, c }: { cmds: string[]; c: PicksCopy }) {
  return (
    <>
      <div className="flex flex-1 flex-col gap-1 overflow-x-auto rounded-xl border border-white/10 bg-[#08070d] px-[18px] py-4 font-mono text-[13px] leading-[1.7]">
        {cmds.map((cmd, i) => (
          <div key={i} className="a-rise whitespace-pre" style={{ animationDelay: `${0.15 + i * 0.4}s` }}>
            <span className="text-[#a99bff]">$ </span>
            {cmd}
          </div>
        ))}
        <div className="a-rise flex items-center gap-1.5 text-[#4cc58a]" style={{ animationDelay: `${0.45 + cmds.length * 0.4}s` }}>
          <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> {c.installed}
        </div>
      </div>
      <p className="text-[12.5px] text-[#a3a0b5]">{c.installNote}</p>
    </>
  );
}

/* ---------- result scenes ---------- */

const SCENES = {
  en: {
    slides: { ask: "I want to create a pitch deck for my AI startup", h: ["Your AI startup,", "told in slides."], done: "Style previews ready. Pick one and the agent builds the full deck." },
    diagram: {
      ask: "Diagram the deployment process for a CI/CD pipeline: Git commit -> Jenkins -> Docker build -> Kubernetes deploy.",
      done: "Diagram written as interactive HTML. Open it, explore it, share it.",
    },
    browser: { ask: "Test on iPhone 13", ok: "Viewport 390 × 844", ask2: "Switch to iPad view", shot: "Screenshot captured", presets: "143 device presets" },
    plan: {
      ask: "I have a rough app idea. Turn it into a spec before we write code.",
      cols: [
        { k: "01 CLARIFY", t: "Asks before it builds", items: ["Who is this for?", "What is out of scope?", "How will we know it works?"] },
        { k: "02 SPEC AND PLAN", t: "Writes it down for review", items: ["Spec you approve first", "Step-by-step plan"] },
        { k: "03 BUILD", t: "Implements, tests first", items: ["Write the failing test", "Make it pass", "Hand off to subagents"] },
      ],
    },
  },
  vi: {
    slides: { ask: "Mình muốn làm pitch deck cho startup AI của mình", h: ["Startup AI của bạn,", "kể bằng slide."], done: "Đã có bản xem trước các phong cách. Chọn một, agent sẽ làm cả bộ slide." },
    diagram: {
      ask: "Vẽ sơ đồ quy trình deploy cho pipeline CI/CD: Git commit -> Jenkins -> Docker build -> Kubernetes deploy.",
      done: "Sơ đồ được viết thành HTML tương tác. Mở ra, khám phá, chia sẻ.",
    },
    browser: { ask: "Test trên iPhone 13", ok: "Viewport 390 × 844", ask2: "Chuyển sang giao diện iPad", shot: "Đã chụp màn hình", presets: "143 thiết bị có sẵn" },
    plan: {
      ask: "Mình có ý tưởng app sơ sơ. Biến nó thành spec trước khi viết code.",
      cols: [
        { k: "01 LÀM RÕ", t: "Hỏi trước khi làm", items: ["Sản phẩm cho ai?", "Cái gì nằm ngoài phạm vi?", "Làm sao biết nó chạy đúng?"] },
        { k: "02 SPEC VÀ KẾ HOẠCH", t: "Viết ra để bạn duyệt", items: ["Spec bạn duyệt trước", "Kế hoạch từng bước"] },
        { k: "03 XÂY DỰNG", t: "Code, viết test trước", items: ["Viết test đang fail", "Làm cho test pass", "Giao việc cho subagent"] },
      ],
    },
  },
};

const d = (s: number) => ({ animationDelay: `${s}s` });

function You({ text, dur = 1.1 }: { text: string; dur?: number }) {
  return (
    <div className="flex items-baseline gap-2 font-mono text-[13px] leading-[1.6]">
      <span className="flex-none text-[#a99bff]">you ›</span>
      <span className="a-type" style={{ animationDuration: `${dur}s` }}>{text}</span>
    </div>
  );
}

function Done({ text, at }: { text: string; at: number }) {
  return (
    <p className="a-rise flex items-center gap-2 text-[13px] text-[#4cc58a]" style={d(at)}>
      <Check className="size-[15px] flex-none" strokeWidth={2.5} aria-hidden /> {text}
    </p>
  );
}

function Scene({ kind, lang }: { kind: SceneKind; lang: Locale }) {
  const s = SCENES[lang];
  if (kind === "slides")
    return (
      <>
        <You text={s.slides.ask} />
        <div className="flex flex-1 flex-wrap gap-3">
          <div className="a-pop flex min-h-[204px] flex-[3_1_300px] flex-col justify-between gap-4 rounded-xl bg-[#f6f3ea] px-[22px] py-5 text-[#141413]" style={d(1.3)}>
            <div className="flex justify-between font-mono text-[10.5px] tracking-[0.08em] text-[#5c5a52]">
              <span>PITCH DECK</span>
              <span>01</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="a-rise text-[30px] font-semibold leading-[1.05] tracking-[-0.03em]" style={d(1.6)}>
                {s.slides.h[0]}
                <br />
                {s.slides.h[1]}
              </div>
              <div aria-hidden className="a-rise flex h-14 items-end gap-1.5" style={d(1.8)}>
                {[16, 26, 22, 38].map((h) => <div key={h} className="w-[18px] rounded-[3px] bg-[#141413]" style={{ height: h }} />)}
                <div className="h-14 w-[18px] rounded-[3px] bg-[#5a3df0]" />
              </div>
            </div>
          </div>
          <div className="flex flex-[1_1_140px] flex-col gap-2">
            {[
              ["STYLE 1", "bg-[#f6f3ea] shadow-[0_0_0_2px_#8f7bff]", "text-[#5c5a52]", "bg-[#141413] w-[70%]", 2],
              ["STYLE 2", "bg-[#1f1c2e] border border-white/12", "text-[#b4b3bd]", "bg-[#f2f1f7] w-[55%]", 2.15],
              ["STYLE 3", "bg-[#5a3df0]", "text-white", "bg-white w-[80%]", 2.3],
            ].map(([label, box, fg, bar, at]) => (
              <div key={label as string} className={`a-rise flex min-h-[60px] flex-1 flex-col justify-between rounded-[10px] px-3 py-2.5 ${box}`} style={d(at as number)}>
                <span className={`font-mono text-[10px] tracking-[0.06em] ${fg}`}>{label}</span>
                <span aria-hidden className={`block h-1.5 rounded-[3px] ${bar}`} />
              </div>
            ))}
          </div>
        </div>
        <Done text={s.slides.done} at={2.7} />
      </>
    );

  if (kind === "diagram") {
    const steps = [
      ["TRIGGER", "Git commit"],
      ["CI", "Jenkins"],
      ["IMAGE", "Docker build"],
      ["RELEASE", "Kubernetes deploy"],
    ];
    return (
      <>
        <You text={s.diagram.ask} dur={1.3} />
        <div className="a-pop flex flex-1 flex-col gap-[18px] overflow-x-auto rounded-xl border border-white/10 bg-[#16141f] px-[18px] pb-5 pt-4" style={d(1.5)}>
          <div className="flex min-w-[560px] justify-between gap-3 font-mono text-[11px] tracking-[0.06em] text-[#a3a0b5]">
            <span>CI/CD PIPELINE</span>
            <span>INTERACTIVE HTML</span>
          </div>
          <div className="flex min-w-[560px] flex-1 items-center">
            {steps.map(([k, v], i) => {
              const last = i === steps.length - 1;
              return (
                <div key={k} className="contents">
                  {i > 0 && <div aria-hidden className="a-draw h-0.5 flex-[0_0_26px] bg-[#8f7bff]" style={d(1.6 + i * 0.5)} />}
                  <div
                    className={cn(
                      "a-pop min-w-0 flex-1 rounded-[10px] border px-3 py-3.5",
                      last ? "border-[#4cc58a]/60 bg-[#16261f]" : "border-[#8f7bff]/50 bg-[#1f1c2e]",
                    )}
                    style={d(1.8 + i * 0.5)}
                  >
                    <div className={cn("font-mono text-[10.5px] tracking-[0.08em]", last ? "text-[#4cc58a]" : "text-[#a99bff]")}>{k}</div>
                    <div className="mt-1.5 text-sm font-semibold text-[#f2f1f7]">{v}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <Done text={s.diagram.done} at={3.7} />
      </>
    );
  }

  if (kind === "browser")
    return (
      <>
        <You text={s.browser.ask} dur={0.6} />
        <div className="flex flex-1 flex-wrap gap-x-6 gap-y-4">
          <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-2.5 font-mono text-[12.5px] leading-normal">
            <div className="a-rise flex flex-wrap gap-1.5" style={d(0.9)}>
              <span className="text-[#a99bff]">›</span>
              <span>playwright_resize</span>
              <span className="text-[#a3a0b5]">{'{ device: "iPhone 13" }'}</span>
            </div>
            <div className="a-rise flex items-center gap-1.5 text-[#4cc58a]" style={d(1.4)}>
              <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> {s.browser.ok}
            </div>
            <div className="a-rise mt-1.5 flex gap-2" style={d(2.4)}>
              <span className="flex-none text-[#a99bff]">you ›</span>
              <span>{s.browser.ask2}</span>
            </div>
            <div className="a-rise flex items-center gap-1.5 text-[#4cc58a]" style={d(2.9)}>
              <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> {s.browser.shot}
            </div>
            <span className="a-rise mt-auto self-start rounded-full border border-white/16 px-2.5 py-1 text-[11.5px] text-[#b4b3bd]" style={d(3.4)}>
              {s.browser.presets}
            </span>
          </div>
          <div className="flex flex-[1_1_280px] items-end justify-center gap-5">
            <div className="a-pop flex flex-col items-center gap-2" style={d(1.5)}>
              <div aria-hidden className="flex h-[200px] w-[98px] flex-col gap-1.5 rounded-[18px] border-2 border-[#3a3750] bg-[#f6f5f0] px-[7px] pb-2 pt-2.5">
                <div className="h-[7px] w-[42%] rounded bg-[#141413]" />
                <div className="h-[58px] rounded-md bg-[#ece8ff]" />
                <div className="h-1.5 rounded-[3px] bg-[#c9c7bf]" />
                <div className="h-1.5 w-[70%] rounded-[3px] bg-[#c9c7bf]" />
                <div className="mt-auto h-5 rounded-md bg-[#5a3df0]" />
              </div>
              <span className="font-mono text-[11px] text-[#a3a0b5]">iPhone 13</span>
            </div>
            <div className="a-pop flex flex-col items-center gap-2" style={d(3)}>
              <div aria-hidden className="flex h-[218px] w-44 flex-col gap-2 rounded-[14px] border-2 border-[#3a3750] bg-[#f6f5f0] px-2.5 pb-2.5 pt-3">
                <div className="flex justify-between">
                  <div className="h-[7px] w-[26%] rounded bg-[#141413]" />
                  <div className="h-[7px] w-[18%] rounded bg-[#c9c7bf]" />
                </div>
                <div className="flex flex-1 gap-2">
                  <div className="flex flex-1 flex-col gap-1.5 pt-2.5">
                    <div className="h-2 rounded bg-[#141413]" />
                    <div className="h-2 w-[80%] rounded bg-[#141413]" />
                    <div className="mt-1.5 h-[5px] rounded-[3px] bg-[#c9c7bf]" />
                    <div className="h-[5px] w-[65%] rounded-[3px] bg-[#c9c7bf]" />
                    <div className="mt-2 h-[18px] w-[60%] rounded-md bg-[#5a3df0]" />
                  </div>
                  <div className="flex-1 rounded-lg bg-[#ece8ff]" />
                </div>
              </div>
              <span className="font-mono text-[11px] text-[#a3a0b5]">iPad</span>
            </div>
          </div>
        </div>
      </>
    );

  // plan
  const dots = ["bg-[#f0a843]", "bg-[#4cc58a]", "bg-[#a99bff]"];
  return (
    <>
      <You text={s.plan.ask} />
      <div className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-3">
        {s.plan.cols.map((col, i) => {
          const last = i === 2;
          return (
            <div
              key={col.k}
              className={cn(
                "a-rise flex flex-col gap-2.5 rounded-xl border p-4",
                last ? "border-[#4cc58a]/50 bg-[#16261f]" : "border-white/10 bg-[#16141f]",
              )}
              style={d(1.4 + i * 0.6)}
            >
              <div className={cn("font-mono text-[11px] tracking-[0.08em]", last ? "text-[#4cc58a]" : "text-[#a99bff]")}>{col.k}</div>
              <div className="text-[15px] font-semibold text-[#f2f1f7]">{col.t}</div>
              <div className="flex flex-col gap-1.5 text-[13px] text-[#b4b3bd]">
                {col.items.map((it, j) =>
                  i === 0 ? (
                    <span key={it}>{it}</span>
                  ) : i === 1 ? (
                    <span key={it} className="flex items-center gap-1.5">
                      <Check className="size-[13px] text-[#4cc58a]" strokeWidth={2.5} aria-hidden />
                      {it}
                    </span>
                  ) : (
                    <span key={it} className="a-rise flex items-center gap-2" style={d(3 + j * 0.3)}>
                      <span aria-hidden className={`size-[7px] rounded-full ${dots[j]}`} />
                      {it}
                    </span>
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
