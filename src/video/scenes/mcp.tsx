import { Plug } from "lucide-react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COPY } from "../copy";
import { caretOn, pop, rise, typed, typedDone } from "../motion";
import { C, MONO, SANS } from "../theme";
import type { Lang } from "../timeline";
import { Captions, Check, NightBg, SafetyPill, Terminal } from "../ui";

const ASK_CPS = 1.4;
const REPLY_CPS = 2.8;

/** Local frames of the key moments (used by the soundtrack in AirscShort) */
export const mcpTimes = (lang: Lang) => {
  const t = COPY[lang].mcp;
  const askEnd = typedDone(t.ask, 6, ASK_CPS);
  const tool = askEnd + 8;
  const row = tool + 14;
  const reply = row + 30;
  const done = typedDone(t.reply, reply, REPLY_CPS) + 8;
  return { askEnd, tool, row, reply, done };
};

/** 21–26 s: skip the website, ask the agent through Airsc MCP */
export function McpChat({ lang }: { lang: Lang }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = COPY[lang].mcp;
  const { askEnd, tool, row, reply, done } = mcpTimes(lang);
  const badge = pop(frame, fps, row + 8);
  const ok = pop(frame, fps, done);

  return (
    <AbsoluteFill>
      <NightBg glow={0.4} />

      <div style={{ position: "absolute", top: 268, left: 0, right: 0, display: "flex", justifyContent: "center", ...rise(frame, fps, 0, 24) }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 14, height: 76, padding: "0 34px", borderRadius: 999, background: "rgba(143,123,255,0.2)", color: "#c4b9ff", fontFamily: MONO, fontWeight: 500, fontSize: 36 }}>
          <Plug size={38} /> {t.tag}
        </span>
      </div>

      <Terminal title="claude · airsc mcp" style={{ left: 60, top: 390, width: 960, height: 910, ...rise(frame, fps, 2, 40) }}>
        <div style={{ padding: "38px 40px", fontFamily: MONO, fontSize: lang === "vi" ? 38 : 35, lineHeight: 1.55, color: C.nightText, display: "flex", flexDirection: "column", gap: 34 }}>
          <div>
            <span style={{ color: C.violet400 }}>you › </span>
            {typed(t.ask, frame, 6, ASK_CPS)}
            {frame < askEnd && caretOn(frame) && "▍"}
          </div>

          {frame >= tool && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 14px", color: C.nightMuted, ...rise(frame, fps, tool, 20) }}>
              <Plug size={34} color={C.nightMuted} />
              <span style={{ color: C.nightText }}>search_resources</span>
              <span style={{ fontSize: 31 }}>{t.tool.replace("search_resources ", "")}</span>
            </div>
          )}

          {frame >= row && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 18,
                padding: "28px 32px",
                borderRadius: 24,
                background: "rgba(143,123,255,0.2)",
                boxShadow: "inset 0 0 0 3px rgba(143,123,255,0.65)",
                ...rise(frame, fps, row, 24),
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 48, color: "#fff" }}>mcp-playwright</span>
                <span style={{ fontSize: 29, color: C.nightMuted }}>★ 5.7k</span>
              </span>
              <span style={{ opacity: Math.min(1, badge * 1.6), transform: `scale(${0.6 + 0.4 * badge})` }}>
                <SafetyPill kind="safe" label={COPY[lang].solution.safe} scale={0.95} />
              </span>
            </div>
          )}

          {frame >= reply && (
            <div>
              <span style={{ color: C.violet400 }}>claude › </span>
              {typed(t.reply, frame, reply, REPLY_CPS)}
            </div>
          )}

          {frame >= done && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, color: C.safeDark, fontWeight: 600, fontSize: 44, opacity: Math.min(1, ok * 1.5), transform: `scale(${0.85 + 0.15 * ok})`, transformOrigin: "left center" }}>
              <Check size={54} stroke={3.4} /> {t.done}
            </div>
          )}
        </div>
      </Terminal>
      <Captions tone="dark" items={[{ from: 6, to: 150, text: t.c }]} />
    </AbsoluteFill>
  );
}
