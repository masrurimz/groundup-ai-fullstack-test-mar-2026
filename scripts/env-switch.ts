#!/usr/bin/env bun
/**
 * Environment switcher for Infisical
 *
 * Usage:
 *   bun env:use staging    # switch to staging
 *   bun env:use prod       # switch to production
 *   bun env:use dev        # switch to dev
 *   bun env:use            # show current environment
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dirname, `..`);
const PKG_PATH = join(ROOT, `package.json`);
const INFISICAL_PATH = join(ROOT, `.infisical.json`);
const DOMAIN = `https://infisical.zahid.es/api`;
const VALID_ENVS = [`dev`, `staging`, `prod`] as const;
type Env = (typeof VALID_ENVS)[number];

function getCurrentEnv(): string {
  const pkg = JSON.parse(readFileSync(PKG_PATH, `utf-8`));
  const match = pkg.scripts[`env:run`]?.match(/--env (\w+)/);
  return match?.[1] ?? `dev`;
}

function switchEnv(env: Env) {
  const previous = getCurrentEnv();

  // Update package.json env:run script
  const pkg = JSON.parse(readFileSync(PKG_PATH, `utf-8`));
  pkg.scripts[`env:run`] = `infisical run --domain ${DOMAIN} --env ${env} --`;
  writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + `\n`);

  // Update .infisical.json defaultEnvironment
  const config = JSON.parse(readFileSync(INFISICAL_PATH, `utf-8`));
  config.defaultEnvironment = env;
  writeFileSync(INFISICAL_PATH, JSON.stringify(config, null, 4) + `\n`);

  console.log(`\n  ✅ Switched: ${previous} → ${env}`);
  console.log(`  Run \`bun dev\` to start with ${env} secrets.\n`);
}

function showCurrent() {
  const env = getCurrentEnv();
  console.log(`\n  Current environment: ${env}`);
  console.log(`  Available: ${VALID_ENVS.join(`, `)}`);
  console.log(`  Usage: bun env:use <environment>\n`);
}

// Main
const target = process.argv[2] as Env | undefined;

if (!target) {
  showCurrent();
} else if (!VALID_ENVS.includes(target)) {
  console.error(`\n  ❌ Invalid: "${target}". Valid: ${VALID_ENVS.join(`, `)}\n`);
  process.exit(1);
} else {
  switchEnv(target);
}
