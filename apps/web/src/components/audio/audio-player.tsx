import { useEffect, useState } from "react";
import ReactH5AudioPlayer, { RHAP_UI } from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import "./audio-player.css";
import { Activity, AudioLines } from "lucide-react";

export interface AudioPlayerProps {
  src: string;
  duration?: number;
  variant: "anomaly" | "baseline";
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, duration, variant }: AudioPlayerProps) {
  const [audioError, setAudioError] = useState(false);
  const durationLabel = duration ? formatTime(duration) : null;

  useEffect(() => {
    setAudioError(false);
  }, [src]);

  const isAnomaly = variant === "anomaly";
  const badgeLabel = isAnomaly ? "Live" : "Baseline";
  const badgeClass = isAnomaly
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : "bg-sky-500/10 text-sky-700 dark:text-sky-400";
  const errorMsg = isAnomaly
    ? `Unable to load audio stream${durationLabel ? ` · expected ${durationLabel}` : ""}.`
    : `Unable to load baseline audio${durationLabel ? ` · expected ${durationLabel}` : ""}.`;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <AudioLines className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Audio Stream</span>
        </div>
        <div className="flex items-center gap-2">
          {durationLabel && (
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
              {durationLabel}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeClass}`}
          >
            <Activity className="h-2.5 w-2.5" />
            {badgeLabel}
          </span>
        </div>
      </div>
      <div className="rhap-player px-4 py-4">
        <ReactH5AudioPlayer
          src={src}
          layout="horizontal"
          preload="metadata"
          autoPlayAfterSrcChange={false}
          showJumpControls={false}
          progressJumpSteps={{ backward: 0, forward: 0 }}
          onError={() => setAudioError(true)}
          customAdditionalControls={[]}
          customVolumeControls={[RHAP_UI.VOLUME]}
        />
      </div>
      {audioError ? (
        <div className="border-t border-border bg-amber-50/60 px-4 py-2 dark:bg-amber-950/30">
          <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">{errorMsg}</p>
        </div>
      ) : (
        <div className="border-t border-border px-4 py-2">
          <p className="text-[11px] text-muted-foreground">
            Seek anywhere · byte-range streaming enabled
          </p>
        </div>
      )}
    </div>
  );
}
