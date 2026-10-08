import { Plug, Sparkles } from "lucide-react";
import type { ResourceType } from "@/lib/types";

/** Card cover that shows what kind of thing this is; hover motion lives in globals.css (.rc:hover) */
export function ResourceArt({ type }: { type: ResourceType }) {
  if (type === "plugin")
    return (
      <Cover className="bg-accent-soft" label=".claude-plugin" labelClass="text-accent">
        <div className="grid grid-cols-[24px_24px] gap-1">
          <div className="h-6 rounded-md bg-ink" />
          <div className="rv-snap h-6 rounded-md bg-accent" />
          <div className="h-6 rounded-md bg-card" />
          <div className="h-6 rounded-md bg-ink" />
        </div>
      </Cover>
    );
  if (type === "skill")
    return (
      <Cover className="bg-art" label="SKILL.md">
        <div className="relative flex w-[50px] flex-col gap-[5px] rounded-md border border-line-strong bg-card px-2 pb-2.5 pt-[9px]">
          <span className="h-1 w-[70%] rounded-sm bg-ink" />
          <span className="h-[3px] rounded-sm bg-sketch" />
          <span className="h-[3px] w-[85%] rounded-sm bg-sketch" />
          <span className="h-[3px] w-[60%] rounded-sm bg-sketch" />
          <Sparkles className="rv-spark absolute -right-[11px] -top-2.5 size-5 fill-accent text-accent" strokeWidth={1.5} />
        </div>
      </Cover>
    );
  if (type === "rule")
    return (
      <Cover className="bg-[#16141f]" label=".cursor/rules" labelClass="text-[#a3a0b5]">
        <div className="flex w-32 flex-col gap-[7px]">
          {[
            [44, 0],
            [62, 8],
            [36, 8],
          ].map(([w, indent], i) => (
            <div key={i} className="flex items-center gap-[7px]">
              <span className="font-mono text-[9px] leading-none text-[#a3a0b5]">{i + 1}</span>
              <span
                className={`h-1 rounded-sm ${i === 0 ? "bg-[#a99bff]" : "bg-[#e8e8ee]"}`}
                style={{ width: `${w}%`, marginLeft: indent }}
              />
              {i === 2 && <span className="rv-cursor -ml-[3px] h-[11px] w-[5px] bg-[#a99bff]" />}
            </div>
          ))}
        </div>
      </Cover>
    );
  // MCP servers and agents: a plug wired out to tools
  return (
    <Cover className="bg-art" label="tools">
      <div className="flex items-center">
        <span className="grid size-8 place-items-center rounded-full bg-ink text-bg">
          <Plug className="size-[15px]" />
        </span>
        <span className="h-0.5 w-6 bg-accent" />
        <div className="rv-slide flex flex-col gap-1">
          <span className="h-3 w-[54px] rounded-md bg-accent" />
          <span className="h-3 w-[42px] rounded-md border border-line-strong bg-card" />
          <span className="h-3 w-12 rounded-md border border-line-strong bg-card" />
        </div>
      </div>
    </Cover>
  );
}

function Cover({
  className,
  label,
  labelClass = "text-muted",
  children,
}: {
  className: string;
  label: string;
  labelClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div aria-hidden className={`relative flex h-[84px] items-center justify-center overflow-hidden rounded-[10px] ${className}`}>
      {children}
      <span className={`absolute bottom-[7px] right-2.5 font-mono text-[10px] ${labelClass}`}>{label}</span>
    </div>
  );
}
