"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Plug, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

function useTyped(text: string, active: boolean, speed = 28) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 1)), speed);
    return () => {
      clearInterval(id);
      setN(0);
    };
  }, [text, active, speed]);
  return text.slice(0, n);
}

const HERO_COPY = {
  en: {
    ask: "Find me a skill so my landing page looks professional, then install it.",
    searching: "Searching Airsc…",
    picked: "Picking the top match and checking its safety label. Installing it now.",
    done: "Installed",
  },
  vi: {
    ask: "Tìm giúp mình skill để landing page trông chuyên nghiệp, rồi cài luôn.",
    searching: "Đang tìm trên Airsc…",
    picked: "Chọn kết quả tốt nhất và kiểm tra nhãn an toàn. Đang cài.",
    done: "Đã cài",
  },
};

export type HeroResult = { name: string; type: string; stars: string; safe: boolean };

/** Looping product demo: user asks their agent, agent calls Airsc MCP, installs the result */
export function HeroDemo({ lang, results }: { lang: "en" | "vi"; results: HeroResult[] }) {
  const c = HERO_COPY[lang];
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? 4 : 0);
  const typed = useTyped(c.ask, step === 0 && !reduce, 26);

  useEffect(() => {
    if (reduce) return;
    const durations = [c.ask.length * 26 + 700, 1300, 1600, 1500, 3200];
    const id = setTimeout(() => setStep((s) => (s + 1) % 5), durations[step]);
    return () => clearTimeout(id);
  }, [step, c.ask.length, reduce]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-term-bg text-term-fg shadow-[0_30px_80px_-30px_rgba(90,61,240,0.45)]">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-xs text-white/50">claude · airsc mcp</span>
      </div>
      <div className="min-h-[300px] space-y-3 p-4 font-mono text-[13px] leading-relaxed sm:p-5">
        <p>
          <span className="text-[#a99bff]">you ›</span> {step === 0 ? typed : c.ask}
          {step === 0 && <span className="caret">▍</span>}
        </p>
        <AnimatePresence>
          {step >= 1 && (
            <motion.div key="search" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-white/60">
              <Plug className="size-3.5" aria-hidden />
              <span>search_resources</span>
              <span className="text-white/40">{'{ query: "landing page design" }'}</span>
              {step === 1 && <span className="text-white/40">{c.searching}</span>}
            </motion.div>
          )}
          {step >= 2 && (
            <motion.ul key="results" className="space-y-1.5" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12 } } }}>
              {results.slice(0, 3).map((r, i) => (
                <motion.li
                  key={r.name}
                  variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 ${i === 0 && step >= 3 ? "bg-[#8f7bff]/20 ring-1 ring-[#8f7bff]/60" : "bg-white/5"}`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-[#a99bff]" aria-hidden />
                    {r.name}
                    <span className="text-white/40">{r.type}</span>
                  </span>
                  <span className="flex items-center gap-3 text-xs">
                    <span className="text-white/50">★ {r.stars}</span>
                    {r.safe && (
                      <span className="inline-flex items-center gap-1 text-[#4cc58a]">
                        <ShieldCheck className="size-3.5" aria-hidden />
                        {lang === "vi" ? "An toàn" : "Safe"}
                      </span>
                    )}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          )}
          {step >= 3 && (
            <motion.p key="picked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/80">
              <span className="text-[#a99bff]">claude ›</span> {c.picked}
            </motion.p>
          )}
          {step >= 4 && (
            <motion.p key="done" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 text-[#4cc58a]">
              <Check className="size-4" aria-hidden /> {c.done}: {results[0]?.name}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Per-resource preview: replays the install as it would look in the user's terminal */
export function InstallPreview({ lines, doneLabel }: { lines: string[]; doneLabel: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? lines.length + 1 : 0);
  useEffect(() => {
    if (reduce) return;
    const id = setTimeout(() => setShown((s) => (s > lines.length + 3 ? 0 : s + 1)), shown === 0 ? 600 : 900);
    return () => clearTimeout(id);
  }, [shown, lines.length, reduce]);
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-term-bg font-mono text-[12.5px] leading-relaxed text-term-fg">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
        <span className="size-2 rounded-full bg-white/20" />
        <span className="size-2 rounded-full bg-white/20" />
        <span className="size-2 rounded-full bg-white/20" />
      </div>
      <div className="min-h-[120px] space-y-1 overflow-x-auto p-3">
        {lines.slice(0, shown).map((l, i) => (
          <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-pre text-white/85">
            <span className="text-[#a99bff]">$ </span>
            {l}
          </motion.p>
        ))}
        {shown > lines.length && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-[#4cc58a]">
            <Check className="size-3.5" aria-hidden /> {doneLabel}
          </motion.p>
        )}
        {shown <= lines.length && <span className="caret text-white/60">▍</span>}
      </div>
    </div>
  );
}
