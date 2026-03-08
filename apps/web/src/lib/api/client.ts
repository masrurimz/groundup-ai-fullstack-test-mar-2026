import { env } from "@groundup-ai-fullstack-test-mar-2026/env";

import { client } from "../api-client/client.gen";

let configured = false;

export function initApiClient() {
  if (!configured) {
    client.setConfig({
      baseUrl: env.VITE_SERVER_URL,
      throwOnError: true,
    });
    configured = true;
  }
}

export function getApiClient() {
  initApiClient();
  return client;
}
