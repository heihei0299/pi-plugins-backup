# Pi plugins backup

This repository is a small, restorable snapshot of the Pi setup currently used by this machine.

## Contents

- `packages.json` — pinned npm package versions and Git commits.
- `extensions/` — the three active local extensions:
  - `pi-plan-mode`
  - `pi-locked-subagents`
  - `native-responses-web-search`
- `config/` — non-secret Pi settings and extension configuration.
- `legacy/` — extensions that are no longer part of the active setup.

Third-party `node_modules`, sessions, caches, credentials, model stores, and machine integration files are intentionally not tracked.

## Sync from the current Pi setup

```bash
pnpm sync
```

The source directory defaults to `~/.pi/agent`. Override it with:

```bash
PI_AGENT_DIR=/path/to/.pi/agent pnpm sync
```

The sync copies only the files listed by the sync script and regenerates `packages.json` from `settings.json`, installed package manifests, and Git `HEAD` revisions.

## Restore the setup

```bash
pnpm restore
```

This copies the tracked settings and local extensions to `~/.pi/agent`, installs the pinned packages with Pi, and installs the native web-search extension's runtime dependencies. Override the destination with `PI_AGENT_DIR`.

Restore intentionally does not touch authentication, model credentials, sessions, caches, or other untracked machine state.

## Current package source of truth

The active package list is the `packages` array in `config/settings.json`; `packages.json` adds the installed npm versions and Git commit pins used by restore.

The local extension source of truth is `extensions/`, not the old files in `legacy/`.
