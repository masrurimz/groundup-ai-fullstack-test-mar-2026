/**
 * Alert media asset URL helpers.
 * These build direct URLs for audio and spectrogram endpoints
 * that don't go through the generated SDK (browser <audio>/<img> tags).
 */

import { getApiV1BaseUrl } from "./config";

/**
 * Get the direct audio URL for an alert.
 */
export function getAlertAudioUrl(id: string): string {
  return `${getApiV1BaseUrl()}/alerts/${id}/audio`;
}

/**
 * Get the direct spectrogram image URL for an alert.
 */
export function getAlertSpectrogramUrl(id: string): string {
  return `${getApiV1BaseUrl()}/alerts/${id}/spectrogram`;
}

/**
 * Get the direct baseline audio URL for an alert (resolves via alert → machine → baseline clip).
 */
export function getAlertBaselineAudioUrl(id: string): string {
  return `${getApiV1BaseUrl()}/alerts/${id}/baseline/audio`;
}

/**
 * Get the direct baseline spectrogram image URL for an alert.
 */
export function getAlertBaselineSpectrogramUrl(id: string): string {
  return `${getApiV1BaseUrl()}/alerts/${id}/baseline/spectrogram`;
}
