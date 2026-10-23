---
name: release
description: Cut a dataviewer release — bump the version, prepend changelog release notes, build the bundle, tag it and attach the artifacts to the GitHub Release
---

# Release

Cut a new release. Given an optional release number, determine the version, bump it
across the version files, prepend release notes to `CHANGELOG.md`, build the bundle,
then tag the release and attach the deployable artifacts to the GitHub Release.

## Inputs

- `number` (optional): a full version (`X.Y.Z`). When omitted, the skill suggests
  the next version and asks for confirmation.

## Versioning scheme

  version = `<major>.<minor>.<patch>`   (plain semver)

- The release version is the `## X.Y.Z` heading in `CHANGELOG.md` and the matching
  git tag (`X.Y.Z`). The current latest is `0.1.8`.
- **The git tag and the CHANGELOG heading are authoritative — not `package.json`.**
  `package.json` and `package-lock.json` currently read `1.0.0`, which has drifted
  from the tag/CHANGELOG. Always detect the current version from the tag and the
  CHANGELOG, and warn the user about the drift instead of trusting `package.json`.
- There is no build number and no native app: this is a web app, deployed as
  `dist/dataviewer.js` + `dist/dataviewer.css`.

## Steps

0. **Full test suite gate** (mandatory first, before any state reads or edits):
   - Run `npm test` (Jest 22 + Enzyme) for the legacy app. If the change touches
     the Vue port, also run `NODE_ENV=test npx vitest run` in `vue-port/`. The
     explicit `NODE_ENV=test` is required — without it, a shell exporting
     `NODE_ENV=production` makes Vite externalize Node builtins to empty browser
     stubs and fails every spec importing them.
   - If any test fails, **stop immediately** — do not bump versions, edit the
     changelog, commit, or tag. Report the failing files/tests and warn the user
     to fix them first; resume the release only once the suite is fully green.

1. Read current state
   - `CHANGELOG.md` -> the latest `## X.Y.Z` heading
   - `git tag` -> the highest `X.Y.Z` tag (the previous release)
   - `package.json` -> `version`
   - `package-lock.json` -> both `"version"` fields (root and `packages[""]`)
   - `copy-to-server.sh` -> the target server path
   - If the tag and the CHANGELOG heading disagree, stop and ask which is correct.

2. Determine the new version
   - If `number` is `X.Y.Z`: use it verbatim.
   - If no `number`: suggest a patch bump `<current>.<minor>.<patch+1>`; for a
     feature/minor release ask whether to bump `<minor>` instead.
   - Print the suggestion and proceed only after confirmation (or immediately
     when an explicit `number` was passed).

3. Apply edits (exact string replacement, preserve indentation)
   - `package.json`: `"version": "<new>"`
   - `package-lock.json`: `"version": "<new>"` in both version fields (root and
     `packages[""]`). npm does not sync these on a hand-edit of `package.json`,
     so bump them explicitly — never `npm install` for this (it rewrites pins
     and may churn unrelated entries).
   - Risk: `package.json` and the git tag drifting apart. This repo has already
     drifted once (manifest `1.0.0` vs tag `0.1.8`) — keep them in sync from
     now on.

4. Generate release notes
   - `git log --oneline <prev-tag>..HEAD` (base = previous release tag).
   - Collapse commits into concise, user-facing bullets grouped by area
     (features, fixes, build/migration, tests); drop internal/CI-only commits.
   - Prepend to `CHANGELOG.md` right after the `# Release Notes` line:
     `## <new>` followed by `- ...` bullets.
   - Mirror the existing bullet style (`- ` / ` - `) exactly.

5. Build
   - `npm run build` — `gulp css && webpack -p --progress` → `dist/dataviewer.js`
     and `dist/dataviewer.css`.
   - Never upload an artifact from a stale `dist/`. Rebuild before attaching.
   - Do NOT confuse the legacy `dist/` with `vue-port/dist/` (the Vite build
     output of the port). The release assets are the **legacy** `dist/` files.

6. Report and confirm follow-up
   - Show version, changed files and the built artifacts.
   - Ask whether to commit (`chore: release <new>`) and create an annotated tag
     (`<new>`, e.g. `0.1.9`, matching the repo's `X.Y.Z` tag history). Do not
     commit or tag unless confirmed.
   - The tag must be pushed to origin — the push is what makes the GitHub
     Release exist for step 7 to attach the artifacts to.

7. Attach the artifacts to the GitHub Release  (after the tag is pushed and the Release exists)

   a. Wait for the Release to be created (retry until it exists):

        gh release view <tag>

   b. With the user's confirmation, upload the deployable bundle:

        gh release upload <tag> dist/dataviewer.js dist/dataviewer.css --clobber

   c. Verify the assets are attached:

        gh release view <tag> --json assets

8. Deploy to the server is a **separate, explicit** step
   - `npm run deploy` runs the build and then `copy-to-server.sh`, which copies
     `dist/dataviewer.js` and `dist/dataviewer.css` into the EpiCollect5 server's
     public directory. It is never implicit in a release — run it only when the
     user asks for it, and confirm the target path first.

## Constraints (AGENTS.md)

- Do NOT introduce TypeScript or new patterns.
- Follow existing architecture/conventions.
- System risk check: the `package.json` version, the `package-lock.json` version
  and the git tag must all name the same release. A mismatch makes the released
  build impossible to identify.
- The release assets MUST come from a fresh `npm run build`; a stale `dist/`
  uploads code that does not match the tag.
- `copy-to-server.sh` writes outside the repo — confirm the destination before
  running it.
