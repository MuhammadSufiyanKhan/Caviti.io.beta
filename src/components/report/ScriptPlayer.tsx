"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { CopyButton } from "@/components/report/CopyButton";
import type { AdScript } from "@/lib/report-data";

const SCENE_MS = 3800;

/** A script as a storyboard: press play to step through each scene's visual and voiceover. */
export function ScriptPlayer({ script }: { script: AdScript }) {
  const scenes = script.scenes ?? [];
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (scene >= scenes.length - 1) setPlaying(false);
      else setScene(scene + 1);
    }, SCENE_MS);
    return () => clearTimeout(timer);
  }, [playing, scene, scenes.length]);

  if (scenes.length === 0) return null;
  const current = scenes[Math.min(scene, scenes.length - 1)];

  const togglePlay = () => {
    if (!playing && scene >= scenes.length - 1) setScene(0);
    setPlaying((p) => !p);
  };

  return (
    <div className="rounded-3xl border border-border bg-surface p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <span className="font-semibold">{script.format || "Script"}</span>
          {script.targetEmotion && <span className="text-muted">Aims for {script.targetEmotion.toLowerCase()}</span>}
          {script.duration && <span className="text-muted">{script.duration}</span>}
        </p>
        <CopyButton
          label="Copy script"
          getText={() => scenes.map((s) => `Scene ${s.sceneNumber}\nVisual: ${s.visual}\nVoice: “${s.voice}”`).join("\n\n")}
        />
      </div>

      <div className="relative mt-5 flex min-h-[230px] sm:aspect-[2/1] sm:min-h-[200px] flex-col justify-between overflow-hidden rounded-2xl border border-border bg-background p-5 sm:p-8">
        <span aria-hidden className="display pointer-events-none absolute -bottom-6 right-4 select-none text-[9rem] leading-none text-foreground/[0.06] sm:text-[12rem]">
          {current.sceneNumber}
        </span>
        <div key={`v-${scene}`} className="relative animate-[fade-up_.4s_ease-out]">
          <p className="text-sm text-muted">Visual</p>
          <p className="display mt-1 max-w-2xl text-2xl leading-tight sm:text-4xl">{current.visual}</p>
        </div>
        <p key={`c-${scene}`} className="relative max-w-xl animate-[fade-up_.4s_ease-out] rounded-xl bg-foreground px-4 py-3 text-[15px] leading-snug text-background sm:text-base">
          “{current.voice}”
        </p>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause script" : "Play script"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent hover:brightness-110"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
        </button>
        <div className="flex flex-1 gap-1.5" role="group" aria-label="Scenes">
          {scenes.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setScene(i);
                setPlaying(false);
              }}
              aria-label={`Go to scene ${s.sceneNumber}`}
              aria-current={i === scene ? "true" : undefined}
              className="group relative h-6 flex-1"
            >
              <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-border">
                <span
                  key={`${i}-${i === scene && playing}`}
                  className="block h-full origin-left rounded-full bg-accent"
                  style={{
                    transform: i < scene || (i === scene && !playing) ? "scaleX(1)" : "scaleX(0)",
                    opacity: i === scene && !playing ? 0.55 : 1,
                    animation: i === scene && playing ? `seg-fill ${SCENE_MS}ms linear forwards` : undefined,
                  }}
                />
              </span>
            </button>
          ))}
        </div>
        <span className="shrink-0 text-sm tabular-nums text-muted">
          {scene + 1}/{scenes.length}
        </span>
      </div>
    </div>
  );
}
