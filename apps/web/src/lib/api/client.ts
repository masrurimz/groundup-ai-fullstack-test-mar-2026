import { env } from "@groundup-ai-fullstack-test-mar-2026/env";

import { client } from "../api-client/client.gen";

let configured = false;

export function getApiClient() {
  if (!configured) {
    client.setConfig({
      baseUrl: env.VITE_SERVER_URL,
      throwOnError: true,
    });
    configured = true;
  }

  return client;
}
