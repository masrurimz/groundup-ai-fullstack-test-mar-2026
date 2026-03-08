import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactH5AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Activity, AudioLines, Loader2 } from "lucide-react";

import {
  fetchWaveform,
  getAlertAudioUrl,
  getAlertSpectrogramUrl,
  updateAlert,
  type WaveformResponse,
} from "../lib/api/alerts";
import { fetchActions, fetchReasons } from "../lib/api/lookup";
import { useAlertsApi } from "../lib/api/use-alerts-api";

export const Route = createFileRoute("/alerts/$alertId")({
  component: AlertDetailPage,
});

function AlertDetailPage() {
  const navigate = useNavigate();
  const { alertId } = Route.useParams();
  const { alerts, isLoading: alertsLoading, error, refetch } = useAlertsApi();
  const [reasonOptions, setReasonOptions] = useState<string[]>([]);
  const [actionOptions, setActionOptions] = useState<string[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [suspectedReason, setSuspectedReason] = useState("");
  const [actionRequired, setActionRequired] = useState("");
  const [comment, setComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const selectedAlert = useMemo(() => {
    return alerts.find((alert) => alert.id === alertId);
  }, [alerts, alertId]);

  const machineLabel = selectedAlert?.machine ?? "CNC Machine";

  useEffect(() => {
    if (!selectedAlert) {
      return;
    }

    setSuspectedReason(selectedAlert.suspected_reason ?? "");
    setActionRequired(selectedAlert.action ?? "");
    setComment(selectedAlert.comment ?? "");
  }, [selectedAlert]);

  useEffect(() => {
    if (!selectedAlert) {
      return;
    }

    let cancelled = false;
    setLookupLoading(true);
    setLookupError(null);

    Promise.all([fetchReasons(selectedAlert.machine), fetchActions()])
      .then(([reasons, actions]) => {
        if (cancelled) {
          return;
        }

        setReasonOptions(reasons);
        setActionOptions(actions);
      })
      .catch(() => {
        if (!cancelled) {
          setLookupError("Unable to load reason/action options from API.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLookupLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedAlert]);

  const handleUpdate = useCallback(async () => {
    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      await updateAlert(alertId, {
        suspected_reason: suspectedReason || null,
        action: actionRequired || null,
        comment: comment.trim() ? comment.trim() : null,
      });
      await refetch();
      setUpdateSuccess(true);
    } catch {
      setUpdateError("Failed to update alert details. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }, [actionRequired, alertId, comment, refetch, suspectedReason]);

  if (alertsLoading) {
    return (
      <section className="min-h-0 overflow-y-auto bg-card p-5 lg:p-8">
        <div className="mx-auto max-w-[1400px]">
          <Skeleton className="mb-2 h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <div className="my-10 h-px bg-border" />
          <div className="grid grid-cols-1 gap-16 xl:grid-cols-2">
            <Skeleton className="h-[460px] rounded-lg" />
            <Skeleton className="h-[460px] rounded-lg" />
          </div>
        </div>
      </section>
    );
  }

  if (!selectedAlert) {
    return (
      <section className="min-h-0 overflow-y-auto bg-card p-5 lg:p-8">
        <Card className="mx-auto max-w-2xl text-center">
          <CardHeader>
            <CardTitle className="text-xl">Alert Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The selected alert ID does not exist in the current alert dataset.
            </p>
            {error ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                API request failed or timed out.
              </p>
            ) : null}
            <Button
              className="mt-6"
              onClick={() => navigate({ to: "/alerts", search: { machine: undefined } })}
            >
              Back To Alerts
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="min-h-0 overflow-y-auto bg-card p-5 lg:p-8">
      <div className="mx-auto max-w-[1400px] pb-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-700">Alert ID #{selectedAlert.id}</h1>
          <p className="mt-1 text-sm text-gray-400">
            Detected at {formatDateTime(selectedAlert.created_at)}
          </p>
        </div>
        <div className="mb-10 h-px bg-border" />

        <div className="mb-12 grid grid-cols-1 gap-16 xl:grid-cols-2">
          <AnomalyPanel alertId={alertId} />
          <BaselinePlaceholderPanel />
        </div>

        <div className="space-y-8 pb-12">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-700">Equipment</h4>
            <p className="mt-1 text-sm text-gray-600">{machineLabel}</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <SelectField
              label="Suspected Reason"
              value={suspectedReason}
              options={reasonOptions}
              placeholder="Select Reason"
              disabled={lookupLoading || isUpdating}
              onChange={setSuspectedReason}
            />
            <SelectField
              label="Action Required"
              value={actionRequired}
              options={actionOptions}
              placeholder="Select Action"
              disabled={lookupLoading || isUpdating}
              onChange={setActionRequired}
            />
          </div>
          {lookupError ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">{lookupError}</p>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-foreground">
              Comments
            </label>
            <Textarea
              rows={6}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={isUpdating}
            />
          </div>

          {updateError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{updateError}</p>
          ) : null}
          {updateSuccess ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Alert updated successfully.
            </p>
          ) : null}

          <div className="pt-4">
            <Button
              className="rounded bg-blue-600 px-10 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-700"
              onClick={() => {
                void handleUpdate();
              }}
              disabled={isUpdating || lookupLoading}
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Anomaly Panel – real data from API
// ---------------------------------------------------------------------------

function AnomalyPanel({ alertId }: { alertId: string }) {
  const [waveform, setWaveform] = useState<WaveformResponse | null>(null);
  const [waveformLoading, setWaveformLoading] = useState(true);
  const [waveformError, setWaveformError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setWaveformLoading(true);
    setWaveformError(false);

    fetchWaveform(alertId)
      .then((data) => {
        if (!cancelled) setWaveform(data);
      })
      .catch(() => {
        if (!cancelled) setWaveformError(true);
      })
      .finally(() => {
        if (!cancelled) setWaveformLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [alertId]);

  return (
    <div className="min-w-0 overflow-hidden">
      <h3 className="mb-6 text-lg font-medium text-foreground">Anomaly Machine Output</h3>
      <AudioPlayer alertId={alertId} duration={waveform?.duration_seconds} />
      <div className="mt-6 space-y-6 pl-12">
        <WaveformChart waveform={waveform} isLoading={waveformLoading} hasError={waveformError} />
        <SpectrogramImage alertId={alertId} duration={waveform?.duration_seconds} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Baseline Placeholder Panel
// ---------------------------------------------------------------------------

function BaselinePlaceholderPanel() {
  return (
    <div>
      <h3 className="mb-6 text-lg font-medium text-foreground">Normal Machine Output</h3>
      <div className="flex h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Baseline reference audio is not available for this alert.
          </p>
          <span className="mt-2 inline-block rounded-full bg-muted px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audio Player
// ---------------------------------------------------------------------------

function AudioPlayer({ alertId, duration: apiDuration }: { alertId: string; duration?: number }) {
  const src = getAlertAudioUrl(alertId);
  const [audioError, setAudioError] = useState(false);
  const durationLabel = formatTime(apiDuration ?? 0);

  useEffect(() => {
    setAudioError(false);
  }, [src]);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/95 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <AudioLines className="h-4 w-4 text-primary" />
          Alert Audio Stream
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary">
            Duration {durationLabel}
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-emerald-700 dark:text-emerald-400">
            <span className="inline-flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Streaming
            </span>
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 px-1 py-1.5 sm:px-2 [&_.rhap_container]:bg-transparent [&_.rhap_container]:p-0 [&_.rhap_container]:shadow-none [&_.rhap_controls-section]:mt-3 [&_.rhap_controls-section]:justify-end [&_.rhap_controls-section]:sm:mt-0 [&_.rhap_controls-section]:sm:justify-start [&_.rhap_main]:gap-3 [&_.rhap_main]:sm:items-center [&_.rhap_main]:sm:gap-4 [&_.rhap_main-controls-button]:text-foreground [&_.rhap_main-controls-button]:transition-colors [&_.rhap_main-controls-button:hover]:text-primary [&_.rhap_play-pause-button]:h-11 [&_.rhap_play-pause-button]:w-11 [&_.rhap_play-pause-button]:rounded-full [&_.rhap_play-pause-button]:bg-primary/10 [&_.rhap_play-pause-button]:text-primary [&_.rhap_progress-filled]:bg-primary [&_.rhap_progress-indicator]:bg-primary [&_.rhap_progress-indicator]:shadow-none [&_.rhap_progress-indicator]:ring-2 [&_.rhap_progress-indicator]:ring-primary/20 [&_.rhap_progress-section]:mx-0 [&_.rhap_progress-section]:grow [&_.rhap_progress-section]:gap-2 [&_.rhap_time]:text-xs [&_.rhap_time]:font-medium [&_.rhap_time]:text-muted-foreground [&_.rhap_volume-button]:text-foreground [&_.rhap_volume-controls]:justify-end [&_.rhap_volume-container]:w-24 [&_.rhap_volume-filled]:bg-primary [&_.rhap_volume-indicator]:bg-primary">
        <ReactH5AudioPlayer
          src={src}
          preload="metadata"
          autoPlayAfterSrcChange={false}
          showJumpControls={false}
          progressJumpSteps={{ backward: 0, forward: 0 }}
          onError={() => setAudioError(true)}
          customAdditionalControls={[]}
          customVolumeControls={["VOLUME"]}
        />
      </div>

      {audioError ? (
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
          Unable to load audio stream right now. Expected clip length: {durationLabel}.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Use the timeline to seek; playback supports byte-range streaming.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Waveform Chart – SVG rendered from real API data
// ---------------------------------------------------------------------------

const WAVEFORM_Y_MIN = -0.75;
const WAVEFORM_Y_MAX = 0.75;
const WAVEFORM_WIDTH = 800;
const WAVEFORM_HEIGHT = 192;

function buildWaveformPath(waveform: WaveformResponse): string {
  const { times, amplitudes, duration_seconds } = waveform;
  if (!times.length || !amplitudes.length) return "";

  const len = Math.min(times.length, amplitudes.length);

  // Downsample if too many points
  const maxPoints = WAVEFORM_WIDTH;
  const step = len > maxPoints ? Math.ceil(len / maxPoints) : 1;

  const x = (t: number) => (t / duration_seconds) * WAVEFORM_WIDTH;
  const y = (a: number) => {
    const clamped = Math.max(WAVEFORM_Y_MIN, Math.min(WAVEFORM_Y_MAX, a));
    return (
      WAVEFORM_HEIGHT -
      ((clamped - WAVEFORM_Y_MIN) / (WAVEFORM_Y_MAX - WAVEFORM_Y_MIN)) * WAVEFORM_HEIGHT
    );
  };

  const parts: string[] = [];
  for (let i = 0; i < len; i += step) {
    const cmd = i === 0 ? "M" : "L";
    parts.push(`${cmd}${x(times[i]!).toFixed(1)} ${y(amplitudes[i]!).toFixed(1)}`);
  }

  return parts.join(" ");
}

const Y_AXIS_LABELS = ["0.75", "0.50", "0.25", "0.00", "-0.25", "-0.50", "-0.75"];

function WaveformChart({
  waveform,
  isLoading,
  hasError,
}: {
  waveform: WaveformResponse | null;
  isLoading: boolean;
  hasError: boolean;
}) {
  const path = useMemo(() => (waveform ? buildWaveformPath(waveform) : ""), [waveform]);

  return (
    <div className="relative h-48 overflow-visible border-b border-l border-border">
      <div className="absolute -left-12 bottom-0 top-0 flex w-10 flex-col items-end justify-between py-1 text-[10px] font-medium text-muted-foreground">
        <span>AMP</span>
        {Y_AXIS_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : hasError || !waveform ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-xs text-muted-foreground">Unable to load waveform data</p>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${WAVEFORM_WIDTH} ${WAVEFORM_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          {/* Zero baseline */}
          <line
            x1="0"
            y1={WAVEFORM_HEIGHT / 2}
            x2={WAVEFORM_WIDTH}
            y2={WAVEFORM_HEIGHT / 2}
            stroke="currentColor"
            className="text-border"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          {/* Waveform path */}
          <path
            d={path}
            fill="none"
            stroke="#3078a6"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spectrogram Image – real PNG from API
// ---------------------------------------------------------------------------

function SpectrogramImage({ alertId, duration }: { alertId: string; duration?: number }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const spectrogramUrl = getAlertSpectrogramUrl(alertId);

  // Generate time axis labels from actual duration
  const timeLabels = useMemo(() => {
    const dur = duration ?? 54;
    const count = 10;
    const step = dur / count;
    return Array.from({ length: count + 1 }, (_, i) => Math.round(i * step));
  }, [duration]);

  return (
    <div className="relative border-b border-l border-border">
      {/* Y-axis labels */}
      <div className="absolute -left-12 bottom-0 top-0 flex w-10 flex-col items-end justify-between py-1 text-[10px] font-medium text-muted-foreground">
        <span>8192</span>
        <span>4096</span>
        <span>2048</span>
        <span>1024</span>
        <span>512</span>
        <span>0</span>
      </div>

      {/* Spectrogram image area */}
      <div className="relative h-64 overflow-hidden bg-gray-950">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {imgError ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-muted-foreground">Unable to load spectrogram</p>
          </div>
        ) : (
          <img
            src={spectrogramUrl}
            alt="Mel spectrogram for this alert"
            className={cn(
              "h-full w-full object-fill transition-opacity duration-300",
              imgLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* X-axis time labels */}
      <div className="flex justify-between px-1 pt-1 text-[10px] font-medium text-muted-foreground">
        {timeLabels.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Select Field
// ---------------------------------------------------------------------------

function SelectField({
  label,
  options,
  value,
  placeholder,
  onChange,
  disabled,
}: {
  label: string;
  options: string[];
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const normalizedOptions = useMemo(() => {
    if (!value || options.includes(value)) {
      return options;
    }

    return [value, ...options];
  }, [options, value]);

  return (
    <div>
      <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-foreground">
        {label}
      </label>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full rounded-md">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {normalizedOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString();
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
