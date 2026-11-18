import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

// The development server answers on a public name. Two settings in its compose file decide
// whether a stranger can walk in, and nothing else in the repo would notice them being edited.
const text = readFileSync("docker-compose.devserver.yml", "utf8");

describe("development server compose file", () => {
  test("pins the synthetic login off, whatever the env file says", () => {
    // /auth/dev-login signs in ANY address with no Google round trip when this flag is true
    // outside production. `environment` outranks `env_file`, so a copied .env cannot turn it on.
    expect(text).toMatch(/^\s+ALLOW_FIRST_LOGIN_ADMIN: "false"$/m);
  });

  test("runs in development mode even when the env file was copied from production", () => {
    expect(text).toMatch(/^\s+NODE_ENV: development$/m);
  });

  test("never answers the package manager download prompt interactively", () => {
    // The container has no terminal: an unanswered prompt would hang the start forever.
    expect(text).toMatch(/^\s+COREPACK_ENABLE_DOWNLOAD_PROMPT: "0"$/m);
  });
});
