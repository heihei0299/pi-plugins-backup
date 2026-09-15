import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

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
  ["settings.json", "config/settings.json"],
  ["locked-subagents.json", "config/locked-subagents.json"],
  ["native-responses-web-search.json", "config/native-responses-web-search.json"],
  ["sol-pi.json", "config/sol-pi.json"],
  ["pi-vcc-config.json", "config/pi-vcc-config.json"],
  ["settings-extensions.json", "config/settings-extensions.json"],
  ["pi-btw.json", "config/pi-btw.json"],
  ["extensions/pi-permission-system/config.json", "config/extensions/pi-permission-system.json"],
  ["extensions/pi-rtk-optimizer/config.json", "config/extensions/pi-rtk-optimizer.json"],
];

async function copyFile(relativeSource, relativeDestination) {
  const source = join(agentRoot, relativeSource);
  const destination = join(repoRoot, relativeDestination);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination);
}

async function pinnedPackage(source) {
  if (source.startsWith("npm:")) {
    const raw = source.slice("npm:".length);
    const match = raw.match(/^(@[^/]+\/[^@]+|[^@]+)(?:@.+)?$/);
    const name = match?.[1];
    if (!name) return source;

    try {
      const manifest = JSON.parse(
        await readFile(join(agentRoot, "npm", "node_modules", name, "package.json"), "utf8"),
      );
      return manifest.version ? `npm:${name}@${manifest.version}` : source;
    } catch {
      return source;
    }
  }

  if (source.startsWith("git:")) {
    const raw = source.slice("git:".length);
    const refSeparator = raw.lastIndexOf("@");
    const pathPart = refSeparator > raw.lastIndexOf("/") ? raw.slice(0, refSeparator) : raw;
    let normalized = pathPart.replace(/^https?:\/\//, "").replace(/^ssh:\/\//, "");
    if (normalized.startsWith("git@")) {
      const separator = normalized.indexOf(":", 4);
      if (separator > 0) {
        normalized = `${normalized.slice(4, separator)}/${normalized.slice(separator + 1)}`;
      }
    }
    normalized = normalized.replace(/\.git$/, "");

    try {
      const commit = execFileSync(
        "git",
        ["-C", join(agentRoot, "git", normalized), "rev-parse", "HEAD"],
        { encoding: "utf8" },
      ).trim();
      return commit ? `${source}@${commit}` : source;
    } catch {
      return source;
    }
  }

  return source;
}

const settings = JSON.parse(await readFile(join(agentRoot, "settings.json"), "utf8"));
if (!Array.isArray(settings.packages) || settings.packages.some((source) => typeof source !== "string")) {
  throw new Error("settings.json must contain a string packages array");
}

for (const [name, files] of Object.entries(extensionFiles)) {
  for (const file of files) {
    await copyFile(`extensions/${name}/${file}`, `extensions/${name}/${file}`);
  }
}

for (const [source, destination] of configFiles) {
  await copyFile(source, destination);
}

const packages = [];
for (const source of settings.packages) {
  packages.push(await pinnedPackage(source));
}
await writeFile(
  join(repoRoot, "packages.json"),
  `${JSON.stringify({ schemaVersion: 1, packages }, null, 2)}\n`,
);

console.log(`Synced ${packages.length} packages and ${Object.keys(extensionFiles).length} local extensions from ${agentRoot}`);
