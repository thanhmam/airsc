"use client";

import { Player } from "@remotion/player";
import type { ShowcaseScene } from "@/lib/types";
import { FPS, SCENE_FRAMES, Showcase } from "./composition";

/** Browser-rendered animated explainer (no server render cost) */
export function ShowcasePlayer({ scenes, name, label }: { scenes: ShowcaseScene[]; name: string; label: string }) {
  if (!scenes?.length) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-term-bg" aria-label={label}>
      <Player
        component={Showcase}
        inputProps={{ scenes, name }}
        durationInFrames={scenes.length * SCENE_FRAMES}
        fps={FPS}
        compositionWidth={1280}
        compositionHeight={720}
        style={{ width: "100%", aspectRatio: "16 / 9" }}
        controls
        autoPlay
        loop
        initiallyMuted
        acknowledgeRemotionLicense
      />
    </div>
  );
}
