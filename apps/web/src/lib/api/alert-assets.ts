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
