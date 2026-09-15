import { cp, mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(import.meta.dirname, "..");
const agentRoot = resolve(
  process.env.PI_AGENT_DIR || process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent"),
);

const extensionFiles = {
  "pi-plan-mode": ["index.ts", "index.test.ts", "pi-plan-mode.ts", "README.md", "utils.ts"],
  "pi-locked-subagents": ["config.ts", "index.ts", "locked-subagents.example.json", "registry.ts", "runner.ts"],
  "native-responses-web-search": [
    "index.ts",
    "index.test.ts",
    "native-responses-web-search.example.json",
    "package.json",
    "pnpm-lock.yaml",
    "README.md",
  ],
};

const configFiles = [
  ["config/settings.json", "settings.json"],
  ["config/locked-subagents.json", "locked-subagents.json"],
  ["config/native-responses-web-search.json", "native-responses-web-search.json"],
  ["config/sol-pi.json", "sol-pi.json"],
  ["config/pi-vcc-config.json", "pi-vcc-config.json"],
  ["config/settings-extensions.json", "settings-extensions.json"],
  ["config/pi-btw.json", "pi-btw.json"],
  ["config/extensions/pi-permission-system.json", "extensions/pi-permission-system/config.json"],
  ["config/extensions/pi-rtk-optimizer.json", "extensions/pi-rtk-optimizer/config.json"],
];

async function copyFile(relativeSource, relativeDestination) {
  const source = join(repoRoot, relativeSource);
  const destination = join(agentRoot, relativeDestination);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination);
}

for (const [name, files] of Object.entries(extensionFiles)) {
  for (const file of files) {
    await copyFile(`extensions/${name}/${file}`, `extensions/${name}/${file}`);
  }
}

for (const [source, destination] of configFiles) {
  await copyFile(source, destination);
}

const nativeWebSearchDir = join(agentRoot, "extensions", "native-responses-web-search");
const dependencyInstall = spawnSync("pnpm", ["install", "--prod", "--ignore-scripts"], {
  cwd: nativeWebSearchDir,
  stdio: "inherit",
});
if (dependencyInstall.error) throw dependencyInstall.error;
if (dependencyInstall.status !== 0) process.exit(dependencyInstall.status ?? 1);

const manifest = JSON.parse(await readFile(join(repoRoot, "packages.json"), "utf8"));
if (!Array.isArray(manifest.packages) || manifest.packages.some((source) => typeof source !== "string")) {
  throw new Error("packages.json must contain a string packages array");
}

for (const source of manifest.packages) {
  const result = spawnSync("pi", ["install", source], {
    cwd: repoRoot,
    env: { ...process.env, PI_CODING_AGENT_DIR: agentRoot },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`Restored ${manifest.packages.length} packages and ${Object.keys(extensionFiles).length} local extensions to ${agentRoot}`);
