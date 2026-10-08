import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Logo } from "@/components/brand/logo";
import { COPY } from "../copy";
import { pop, rise } from "../motion";
import { C, MONO, SANS } from "../theme";
import type { Lang } from "../timeline";
import { PaperBg, Words } from "../ui";

/** 26–30 s: where to go. Free, no account. */
export function Cta({ lang }: { lang: Lang }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = COPY[lang].cta;
  const logo = pop(frame, fps, 3);
  const url = pop(frame, fps, 36);
  const pulse = 1 + 0.025 * Math.sin(Math.max(0, frame - 50) * 0.28);

  return (
    <AbsoluteFill>
      <PaperBg />
      <div style={{ position: "absolute", top: 440, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, logo * 1.5), transform: `scale(${0.8 + 0.2 * logo})` }}>
        <Logo tone="light" style={{ width: 720, height: 331 }} />
      </div>

      <div style={{ position: "absolute", top: 860, left: 60, right: 60 }}>
        <Words text={t.headline} from={14} size={90} tone="light" />
      </div>

      <div style={{ position: "absolute", top: 1140, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 500, fontSize: 44, color: C.muted, ...rise(frame, fps, 26, 24) }}>{t.sub}</div>

      <div style={{ position: "absolute", top: 1256, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 128,
            padding: "0 64px",
            borderRadius: 64,
            background: C.violet,
            color: "#fff",
            fontFamily: MONO,
            fontWeight: 500,
            fontSize: 56,
            boxShadow: "0 30px 80px -24px rgba(90,61,240,0.7)",
            opacity: Math.min(1, url * 1.5),
            transform: `scale(${(0.7 + 0.3 * url) * pulse})`,
          }}
        >
          {t.url}
        </span>
      </div>
    </AbsoluteFill>
  );
}
