import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./openapi.json",
  output: "./src/lib/api-client",
  plugins: ["@tanstack/react-query"],
});
