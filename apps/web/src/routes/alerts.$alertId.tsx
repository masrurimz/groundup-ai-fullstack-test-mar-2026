import { z } from "zod";

import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import ReactH5AudioPlayer, { RHAP_UI } from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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

import { getWaveformApiV1AlertsAlertIdWaveformGet, type WaveformResponse } from "../lib/api-client";
import { getAlertAudioUrl, getAlertSpectrogramUrl } from "../lib/api/alert-assets";
import { getApiClient } from "../lib/api/client";
import type { AlertView } from "../lib/api/alert-view";
import { useAlertsApi } from "../lib/api/use-alerts-api";
import {
  actionsQueryOptions,
  reasonsQueryOptions,
  useUpdateAlertMutation,
} from "../lib/query/options";

export const Route = createFileRoute("/alerts/$alertId")({
  component: AlertDetailPage,
});

function AlertDetailPage() {
  const navigate = useNavigate();
  const { alertId } = Route.useParams();
  const { alerts, isLoading: alertsLoading, error } = useAlertsApi();

  const selectedAlert = useMemo(() => {
    return alerts.find((alert) => alert.id === alertId);
  }, [alerts, alertId]);

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

        <AlertEditForm key={selectedAlert.id} alert={selectedAlert} />
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

    getWaveformApiV1AlertsAlertIdWaveformGet({
      client: getApiClient(),
      throwOnError: true,
      path: { alert_id: Number(alertId) },
    })
      .then(({ data }) => {
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
        <SpectrogramImage alertId={alertId} />
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
  const durationLabel = apiDuration ? formatTime(apiDuration) : null;

  useEffect(() => {
    setAudioError(false);
  }, [src]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <AudioLines className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Audio Stream</span>
        </div>
        <div className="flex items-center gap-2">
          {durationLabel ? (
            <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
              {durationLabel}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <Activity className="h-2.5 w-2.5" />
            Live
          </span>
        </div>
      </div>

      {/* Player body */}
      <div className="px-4 py-4 [&_.rhap_container]:bg-transparent [&_.rhap_container]:p-0 [&_.rhap_container]:shadow-none [&_.rhap_horizontal]:items-center [&_.rhap_horizontal_.rhap_controls-section]:ml-3 [&_.rhap_main-controls]:flex [&_.rhap_main-controls]:items-center [&_.rhap_main-controls]:justify-center [&_.rhap_play-pause-button]:flex [&_.rhap_play-pause-button]:h-9 [&_.rhap_play-pause-button]:w-9 [&_.rhap_play-pause-button]:items-center [&_.rhap_play-pause-button]:justify-center [&_.rhap_play-pause-button]:rounded-full [&_.rhap_play-pause-button]:bg-primary [&_.rhap_play-pause-button]:text-[20px] [&_.rhap_play-pause-button]:text-primary-foreground [&_.rhap_play-pause-button]:transition-opacity [&_.rhap_play-pause-button:hover]:opacity-80 [&_.rhap_controls-section]:flex [&_.rhap_controls-section]:items-center [&_.rhap_controls-section]:justify-end [&_.rhap_progress-section]:flex [&_.rhap_progress-section]:items-center [&_.rhap_progress-section]:gap-2 [&_.rhap_progress-container]:flex-1 [&_.rhap_progress-container]:cursor-pointer [&_.rhap_progress-bar]:h-1.5 [&_.rhap_progress-bar]:rounded-full [&_.rhap_progress-bar-show-download]:bg-muted [&_.rhap_download-progress]:rounded-full [&_.rhap_download-progress]:bg-border [&_.rhap_progress-filled]:rounded-full [&_.rhap_progress-filled]:bg-primary [&_.rhap_progress-indicator]:!h-3.5 [&_.rhap_progress-indicator]:!w-3.5 [&_.rhap_progress-indicator]:!-top-1 [&_.rhap_progress-indicator]:!ml-[-7px] [&_.rhap_progress-indicator]:rounded-full [&_.rhap_progress-indicator]:bg-primary [&_.rhap_progress-indicator]:shadow [&_.rhap_progress-indicator]:ring-[3px] [&_.rhap_progress-indicator]:ring-primary/25 [&_.rhap_time]:text-[11px] [&_.rhap_time]:tabular-nums [&_.rhap_time]:text-muted-foreground [&_.rhap_volume-controls]:flex [&_.rhap_volume-controls]:items-center [&_.rhap_volume-controls]:gap-1 [&_.rhap_volume-button]:flex [&_.rhap_volume-button]:h-7 [&_.rhap_volume-button]:w-7 [&_.rhap_volume-button]:items-center [&_.rhap_volume-button]:justify-center [&_.rhap_volume-button]:rounded-md [&_.rhap_volume-button]:text-[16px] [&_.rhap_volume-button]:text-muted-foreground [&_.rhap_volume-button]:transition-colors [&_.rhap_volume-button:hover]:bg-muted [&_.rhap_volume-button:hover]:text-foreground [&_.rhap_volume-container]:w-20 [&_.rhap_volume-bar-area]:h-3 [&_.rhap_volume-bar]:h-1 [&_.rhap_volume-bar]:rounded-full [&_.rhap_volume-bar]:bg-muted [&_.rhap_volume-filled]:rounded-full [&_.rhap_volume-filled]:bg-primary [&_.rhap_volume-indicator]:!h-2.5 [&_.rhap_volume-indicator]:!w-2.5 [&_.rhap_volume-indicator]:!-top-[3px] [&_.rhap_volume-indicator]:!ml-[-5px] [&_.rhap_volume-indicator]:rounded-full [&_.rhap_volume-indicator]:bg-primary [&_.rhap_volume-indicator]:shadow-sm [&_.rhap_additional-controls]:hidden">
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

      {/* Footer status */}
      {audioError ? (
        <div className="border-t border-border bg-amber-50/60 px-4 py-2 dark:bg-amber-950/30">
          <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
            Unable to load audio stream{durationLabel ? ` · expected ${durationLabel}` : ""}.
          </p>
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

// ---------------------------------------------------------------------------
// Waveform Chart – SVG rendered from real API data
// ---------------------------------------------------------------------------

const WAVEFORM_WIDTH = 800;
const WAVEFORM_HEIGHT = 192;
const WAVEFORM_LABEL_TICKS = 7;
const WAVEFORM_MIN_SPAN = 0.2;
const WAVEFORM_PADDING_FACTOR = 0.08;

type WaveformBounds = {
  min: number;
  max: number;
};

function getWaveformBounds(amplitudes: number[]): WaveformBounds {
  const minAmp = Math.min(...amplitudes);
  const maxAmp = Math.max(...amplitudes);
  const span = maxAmp - minAmp;
  const paddedSpan = Math.max(span, WAVEFORM_MIN_SPAN);
  const pad = paddedSpan * WAVEFORM_PADDING_FACTOR;
  const center = (maxAmp + minAmp) / 2;
  const half = paddedSpan / 2 + pad;

  return {
    min: center - half,
    max: center + half,
  };
}

function buildWaveformPath(waveform: WaveformResponse, bounds: WaveformBounds): string {
  const { times, amplitudes, duration_seconds } = waveform;
  if (!times.length || !amplitudes.length) return "";

  const len = Math.min(times.length, amplitudes.length);

  // Downsample if too many points
  const maxPoints = WAVEFORM_WIDTH;
  const step = len > maxPoints ? Math.ceil(len / maxPoints) : 1;
  const yRange = bounds.max - bounds.min;

  const x = (t: number) => (t / duration_seconds) * WAVEFORM_WIDTH;
  const y = (a: number) => {
    const clamped = Math.max(bounds.min, Math.min(bounds.max, a));
    return WAVEFORM_HEIGHT - ((clamped - bounds.min) / yRange) * WAVEFORM_HEIGHT;
  };

  const parts: string[] = [];
  for (let i = 0; i < len; i += step) {
    const cmd = i === 0 ? "M" : "L";
    parts.push(cmd + x(times[i]!).toFixed(1) + " " + y(amplitudes[i]!).toFixed(1));
  }

  return parts.join(" ");
}

function formatAmplitudeLabel(value: number): string {
  return value.toFixed(2);
}

function WaveformChart({
  waveform,
  isLoading,
  hasError,
}: {
  waveform: WaveformResponse | null;
  isLoading: boolean;
  hasError: boolean;
}) {
  const bounds = useMemo(() => {
    if (!waveform || waveform.amplitudes.length === 0) {
      return { min: -1, max: 1 };
    }

    return getWaveformBounds(waveform.amplitudes);
  }, [waveform]);

  const path = useMemo(
    () => (waveform ? buildWaveformPath(waveform, bounds) : ""),
    [bounds, waveform],
  );

  const yAxisLabels = useMemo(() => {
    const step = (bounds.max - bounds.min) / (WAVEFORM_LABEL_TICKS - 1);
    return Array.from({ length: WAVEFORM_LABEL_TICKS }, (_, index) =>
      formatAmplitudeLabel(bounds.max - step * index),
    );
  }, [bounds]);

  const zeroBaselineY =
    0 >= bounds.min && 0 <= bounds.max
      ? WAVEFORM_HEIGHT - ((0 - bounds.min) / (bounds.max - bounds.min)) * WAVEFORM_HEIGHT
      : null;

  return (
    <div className="relative h-48 overflow-visible border-b border-l border-border">
      <div className="absolute -left-12 bottom-0 top-0 flex w-10 flex-col items-end justify-between py-1 text-[10px] font-medium text-muted-foreground">
        <span>AMP</span>
        {yAxisLabels.map((label) => (
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
          viewBox={"0 0 " + WAVEFORM_WIDTH + " " + WAVEFORM_HEIGHT}
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          {/* Zero baseline */}
          {zeroBaselineY !== null ? (
            <line
              x1="0"
              y1={zeroBaselineY}
              x2={WAVEFORM_WIDTH}
              y2={zeroBaselineY}
              stroke="currentColor"
              className="text-border"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
          ) : null}
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

function SpectrogramImage({ alertId }: { alertId: string }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const spectrogramUrl = getAlertSpectrogramUrl(alertId);

  return (
    <div className="rounded-md border border-border">
      {/* Spectrogram image area */}
      <div className="relative h-64 overflow-hidden rounded-md bg-gray-950">
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Alert Edit Form – TanStack Form + TanStack Query
// ---------------------------------------------------------------------------

const alertSchema = z.object({
  suspected_reason_id: z.string().min(1, "Suspected reason is required"),
  action_id: z.string().min(1, "Action is required"),
  comment: z.string().min(1, "Comment is required"),
});

function AlertEditForm({ alert }: { alert: AlertView }) {
  const machineId = alert.machine_id ?? undefined;

  const reasonsQuery = useQuery(reasonsQueryOptions(machineId));
  const actionsQuery = useQuery(actionsQueryOptions());
  const updateMutation = useUpdateAlertMutation(Number(alert.id));

  const reasons = reasonsQuery.data ?? [];
  const actions = actionsQuery.data ?? [];

  const reasonItems = useMemo(
    () => reasons.map((r) => ({ value: String(r.id), label: r.name })),
    [reasons],
  );
  const actionItems = useMemo(
    () => actions.map((a) => ({ value: String(a.id), label: a.name })),
    [actions],
  );

  // Don't render form until lookups are loaded so defaultValues + items are ready together
  if (reasonsQuery.isLoading || actionsQuery.isLoading) {
    return (
      <div className="space-y-8 pb-12">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <AlertEditFormInner
      alert={alert}
      reasons={reasons}
      actions={actions}
      reasonItems={reasonItems}
      actionItems={actionItems}
      updateMutation={updateMutation}
    />
  );
}

function AlertEditFormInner({
  alert,
  reasons,
  actions,
  reasonItems,
  actionItems,
  updateMutation,
}: {
  alert: AlertView;
  reasons: { id: number; name: string }[];
  actions: { id: number; name: string }[];
  reasonItems: { value: string; label: string }[];
  actionItems: { value: string; label: string }[];
  updateMutation: ReturnType<typeof useUpdateAlertMutation>;
}) {
  const form = useForm({
    defaultValues: {
      suspected_reason_id:
        alert.suspected_reason_id != null ? String(alert.suspected_reason_id) : "",
      action_id: alert.action_id != null ? String(alert.action_id) : "",
      comment: alert.comment ?? "",
    },
    validators: {
      onSubmit: alertSchema,
    },
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync({
        suspected_reason_id: value.suspected_reason_id ? Number(value.suspected_reason_id) : null,
        action_id: value.action_id ? Number(value.action_id) : null,
        comment: value.comment.trim() || null,
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      className="space-y-8 pb-12"
    >
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-700">Equipment</h4>
        <p className="mt-1 text-sm text-gray-600">{alert.machine}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Suspected Reason */}
        <form.Field name="suspected_reason_id">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Suspected Reason</FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value || null}
                  onValueChange={(v) => field.handleChange(v ?? "")}
                  items={reasonItems}
                >
                  <SelectTrigger id={field.name} aria-invalid={isInvalid} className="w-full">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {reasons.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        {/* Action Required */}
        <form.Field name="action_id">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Action Required</FieldLabel>
                <Select
                  name={field.name}
                  value={field.state.value || null}
                  onValueChange={(v) => field.handleChange(v ?? "")}
                  items={actionItems}
                >
                  <SelectTrigger id={field.name} aria-invalid={isInvalid} className="w-full">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    {actions.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </div>

      {/* Comment */}
      <form.Field name="comment">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Comments</FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                rows={6}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      {/* Status */}
      {updateMutation.isError ? (
        <p className="text-sm text-red-600">Failed to update alert. Please try again.</p>
      ) : null}
      {updateMutation.isSuccess ? (
        <p className="text-sm text-emerald-700">Alert updated successfully.</p>
      ) : null}

      {/* Submit */}
      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            className="rounded bg-blue-600 px-10 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-700"
            disabled={!canSubmit}
          >
            {isSubmitting ? "Updating…" : "Update"}
          </Button>
        )}
      </form.Subscribe>
    </form>
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
