"use client";

import { useState } from "react";

type Point = { label: string; value: number };

const fmt = (v: number, unit: "count" | "usd") =>
  unit === "usd" ? `$${v < 1 ? v.toFixed(3) : v.toFixed(2)}` : v.toLocaleString();

/**
 * Single-series daily bar chart: one hue (accent), thin bars with a 2px gap, rounded data-ends
 * anchored to the baseline, recessive grid, hover tooltip and a table view.
 */
export function BarChart({ title, data, unit = "count", total }: { title: string; data: Point[]; unit?: "count" | "usd"; total: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 360;
  const H = 130;
  // y labels live in the right gutter so they never sit on top of bars
  const pad = { top: 8, bottom: 18, left: 2, right: 40 };
  const raw = Math.max(...data.map((d) => d.value), unit === "usd" ? 0.01 : 1);
  const max = unit === "usd" ? raw : Math.max(1, Math.ceil(raw));
  const ticks = unit === "usd" ? [max / 2, max] : max >= 2 ? [Math.round(max / 2), max] : [max];
  const slot = (W - pad.left - pad.right) / data.length;
  const barW = Math.max(2, slot - 2);
  const y = (v: number) => pad.top + (H - pad.top - pad.bottom) * (1 - v / max);
  const base = H - pad.bottom;
  const h = hover === null ? null : data[hover];

  return (
    <figure className="rounded-2xl border border-line bg-card p-4">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted">
          {h ? (
            <>
              {h.label}: <b className="tabular-nums text-fg">{fmt(h.value, unit)}</b>
            </>
          ) : (
            <>
              30d: <b className="tabular-nums text-fg">{total}</b>
            </>
          )}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`${title}, ${total} in 30 days`} onMouseLeave={() => setHover(null)}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray="2 4" />
            <text x={W - 2} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--muted)">
              {fmt(v, unit)}
            </text>
          </g>
        ))}
        <line x1={pad.left} x2={W - pad.right} y1={base} y2={base} stroke="var(--line)" />
        {data.map((d, i) => {
          const x = pad.left + i * slot + 1;
          const top = y(d.value);
          const r = Math.min(4, barW / 2, base - top);
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)}>
              {/* hit target is the full column, larger than the bar */}
              <rect x={pad.left + i * slot} y={pad.top} width={slot} height={base - pad.top} fill="transparent" />
              {d.value > 0 && (
                <path
                  d={`M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${base} Z`}
                  fill="var(--accent)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
            </g>
          );
        })}
        {[0, Math.floor(data.length / 2), data.length - 1].map((i, k) => (
          <text
            key={i}
            x={k === 0 ? pad.left : k === 2 ? pad.left + (i + 1) * slot : pad.left + i * slot + slot / 2}
            y={H - 5}
            textAnchor={k === 0 ? "start" : k === 2 ? "end" : "middle"}
            fontSize="10"
            fill="var(--muted)"
          >
            {data[i]?.label}
          </text>
        ))}
      </svg>
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer">Data</summary>
        <table className="mt-2 w-full">
          <tbody>
            {data
              .filter((d) => d.value > 0)
              .map((d) => (
                <tr key={d.label} className="border-t border-line">
                  <td className="py-1">{d.label}</td>
                  <td className="py-1 text-right tabular-nums text-fg">{fmt(d.value, unit)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
