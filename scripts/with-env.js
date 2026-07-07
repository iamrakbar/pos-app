#!/usr/bin/env node

const { existsSync, readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { resolve } = require("node:path");

const [, , variant, separator, ...command] = process.argv;

const validVariants = new Set(["development", "preview", "production"]);

if (!validVariants.has(variant) || separator !== "--" || command.length === 0) {
  console.error("Usage: node scripts/with-env.js <development|preview|production> -- <command...>");
  process.exit(1);
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return env;

      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) return env;

      const key = trimmed.slice(0, equalsIndex).trim();
      let value = trimmed.slice(equalsIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      env[key] = value;
      return env;
    }, {});
}

const envFile = resolve(process.cwd(), `.env.${variant}`);
const fallbackEnvFile = resolve(process.cwd(), ".env");
const env = {
  ...parseEnvFile(fallbackEnvFile),
  ...parseEnvFile(envFile),
  ...process.env,
  APP_VARIANT: variant,
};

const result = spawnSync(command[0], command.slice(1), {
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
