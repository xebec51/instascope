# InstaScope Technical Audit

Last updated: 2026-07-18 on branch `codex/production-overhaul`.

## Baseline Repository State

- Starting branch: `main`
- Working tree before edits: clean
- Recent history inspected with `git log --oneline -10`; the latest commit was `1fbd726 feat: add hero header and empty state UI for improved first-load experience`.
- New implementation branch: `codex/production-overhaul`
- Local runtime during baseline: Node `v22.16.0`, npm `10.9.2`

## Baseline Commands

These commands were run before changing application behavior.

| Command         | Result | Notes                                                                                                                                                                                                              |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm ci`        | Passed | Installed 201 packages and audited 202 packages. Reported 10 vulnerabilities: 1 low, 4 moderate, 5 high.                                                                                                           |
| `npm run lint`  | Passed | ESLint completed with no reported issues.                                                                                                                                                                          |
| `npm run build` | Passed | Vite built successfully. Output included `dist/assets/index-8H8MyblK.js` at 198.60 kB raw / 62.44 kB gzip and `dist/assets/index-CnCBzpn_.css` at 3.81 kB raw / 1.25 kB gzip.                                      |
| `npm audit`     | Failed | Reported 10 vulnerabilities in transitive tooling dependencies, including advisories for `@babel/core`, `ajv`, `brace-expansion`, `flatted`, `js-yaml`, `minimatch`, `picomatch`, `postcss`, `rollup`, and `vite`. |

`npm outdated --long` showed newer compatible versions for React, React DOM, Vite, ESLint, `@vitejs/plugin-react`, and React type packages. `gh-pages` is still present but should be replaced by GitHub Actions Pages deployment.

## Existing Architecture and Data Flow

The current app is a small React/Vite application using JavaScript and CSS:

- `src/main.jsx` mounts React into `#root`.
- `src/App.jsx` renders a header and `FileUpload`.
- `src/components/FileUpload.jsx` owns file selection, JSON reading, parsing, comparison, loading state, and view state in one component.
- `src/components/ResultList.jsx` renders a searchable list of username strings and constructs Instagram profile links directly from those strings.
- `src/components/Stats.jsx` exists but is empty.
- `src/utils/instagramParser.js` contains the only parser helpers.
- Styling is split between `src/index.css` and `src/App.css`.

Data flow is currently:

1. User selects one followers JSON file and one following JSON file.
2. `FileReader` parses each file with `JSON.parse`.
3. `parseFollowers` and `parseFollowing` return arrays of strings.
4. `FileUpload` computes mutual and non-mutual lists with `Set`.
5. The component stores several full result arrays in independent state variables.

The parser and analysis logic are tightly coupled to React state transitions and browser file inputs. There is no testable import pipeline, no structured error model, and no ZIP/archive support.

## Parser Assumptions

Current assumptions:

- Followers data is always a top-level array.
- Follower usernames always live at `string_list_data[0].value`.
- Following data is always an object with `relationships_following`.
- Following usernames live in `title` or `string_list_data[0].value`.
- JSON is valid.
- Files are selected in the correct fields.
- Usernames are safe to use directly in URLs.
- Input order is meaningful enough to preserve.
- Duplicate and case-varied usernames do not occur.

Missing support:

- Followers object shape with `relationships_followers`.
- Multiple follower pages such as `followers_1.json`, `followers_2.json`, and `followers_3.json`.
- Following names like `following_1.json`.
- Empty but valid exports.
- Malformed entries, unrelated JSON, HTML exports, reversed files, and partial exports.
- Optional `href` and `timestamp` preservation.
- Runtime type guards.
- Deterministic deduplication and sorting.

## Known Failure Conditions

- Missing file inputs trigger `window.alert()`, which is disruptive and inaccessible.
- Invalid JSON throws and falls into a generic alert.
- Parser failures can throw TypeErrors, for example if `relationships_following` is missing.
- Zero followers and zero following are treated like the initial state because `hasAnalyzed` is derived from array lengths.
- Followers and following files accidentally reversed are not detected precisely.
- Usernames are compared case-sensitively.
- Duplicates are not removed.
- Arbitrary parsed strings are interpolated into profile URLs.
- Usernames are keyed by array index, causing unstable React keys.
- Console logging can expose raw error context if future errors include imported data.

## Accessibility Problems

- Duplicate product headers create a confusing heading structure.
- File inputs are wrapped by labels without `htmlFor`.
- There is no skip link.
- No semantic `main` or `footer`.
- Status and error messages are not exposed through `aria-live`.
- `window.alert()` is used for validation and processing errors.
- Result category buttons do not expose selected state.
- Keyboard tab navigation for result categories is not implemented.
- The SVG icon in results lacks accessible handling.
- Focus is not moved to results after a successful analysis.
- Focus visibility relies on browser defaults and is inconsistent.
- Color contrast has not been verified for light or dark mode.
- There is no automated accessibility test coverage.

## Responsive Design Problems

- The UI is centered in a fixed-width root with large padding that can feel cramped at 320px.
- Result lists use a fixed max height without richer pagination or incremental rendering.
- Buttons and form controls are basic and not optimized for touch targets.
- There is no validated tablet or large-desktop layout.
- Existing copy includes mojibake characters in README/UI text, which harms polish and readability.

## Performance Limitations

- The app cannot import ZIP archives and only reads two files.
- There is no file-size guard before expensive reads.
- Thousands of results can be rendered into one scroll container.
- Several derived arrays are stored in independent state variables.
- Filtering lowercases every username on each query update.
- No progress/status model exists for long-running import and parse operations.

## Privacy and Security Properties

Strong existing properties:

- No backend.
- No Instagram login.
- No Instagram API usage.
- No database.
- No analytics dependency.

Gaps to close:

- No explicit Content Security Policy.
- No referrer policy metadata.
- Profile URLs are built from unvalidated strings.
- No documented threat model.
- No PWA/offline behavior.
- No guarantee that imported data is never persisted.
- Existing docs claim offline behavior after loading, but no service worker is implemented.

## Dependency Health

Current direct dependencies:

- Runtime: `react`, `react-dom`
- Development: `@vitejs/plugin-react`, `vite`, ESLint packages, React type packages, `globals`, `gh-pages`

Health notes:

- `npm audit` currently fails due to vulnerable transitive packages. The largest practical fixes are dependency updates and removing obsolete `gh-pages`.
- `gh-pages` is unnecessary once official GitHub Pages Actions deployment is used.
- Vite and Rollup advisories should be resolved by updating within supported versions rather than using `npm audit fix --force`.
- A TypeScript migration requires `typescript` and TypeScript-aware ESLint tooling.
- Testing requires Vitest, React Testing Library, user-event, jsdom or happy-dom, axe integration, and Playwright.

## ZIP Library Decision

The browser-only import feature needs a lightweight ZIP reader that does not pull in unnecessary dependencies.

Packages reviewed on 2026-07-18:

- `fflate` `0.8.3`: MIT license, no listed dependencies, npm description "High performance (de)compression in an 8kB package", unpacked package size about 796,742 bytes, last modified 2026-05-16, repository `101arrowz/fflate`.
- `jszip` `3.10.1`: `(MIT OR GPL-3.0-or-later)` license, depends on `lie`, `pako`, `setimmediate`, and `readable-stream`, unpacked package size about 762,000 bytes, last modified 2025-03-14.

Decision: use `fflate`. It is dependency-free, permissively licensed, recently published, and better aligned with a small browser-only application. The app will only enumerate and read matching Instagram relationship JSON files; unrelated archive contents will not be retained.

## Testing Gaps

There are currently no tests. Missing coverage includes:

- Parser shape variants.
- Username normalization and validation.
- Duplicate handling.
- Case-insensitive comparisons.
- Empty valid exports.
- Structured import errors.
- CSV escaping.
- ZIP and multi-file import.
- React state transitions.
- Accessibility behavior.
- End-to-end GitHub Pages base-path behavior.

## Deployment Gaps

- Deployment currently depends on the `gh-pages` package and local scripts.
- There is no CI workflow.
- There is no official GitHub Pages artifact deployment workflow.
- There is no Dependabot configuration.
- There is no Playwright coverage for built app behavior under `/instascope/`.
- `index.html` still references `/vite.svg` and has template metadata.

## Documentation Inconsistencies

- README claims an MIT license, but no `LICENSE` file exists.
- README claims offline behavior after loading, but no PWA/service worker exists.
- README has mojibake characters.
- README documents only two manual JSON files.
- No security policy, contributing guide, changelog, agent instructions, or threat model exists.

## Implementation Plan

1. Modernize the foundation with strict TypeScript, organized source folders, updated scripts, Prettier, supported Node LTS metadata, dependency updates, and obsolete deployment script removal.
2. Build pure parser and analysis modules with runtime type guards, deterministic normalization, structured errors, multi-file merge support, and CSV export.
3. Add ZIP/archive import with file-size limits, asynchronous parsing, precise errors, and no retention of unrelated archive entries.
4. Redesign the React application around a semantic shell, accessible import states, theme control, privacy messaging, result tabs, search, sorting, pagination, copy, CSV export, and full reset behavior.
5. Add PWA assets, manifest, CSP/referrer metadata, and offline caching limited to the app shell.
6. Add Vitest, React Testing Library, user-event, axe assertions, Playwright end-to-end tests, and synthetic fixtures.
7. Replace `gh-pages` with GitHub Actions CI and Pages deployment workflows plus Dependabot.
8. Rewrite README and add repository hygiene documents.
9. Run final verification from a clean dependency installation and document all actual results.

## Post-Implementation Notes

- Runtime code now uses strict TypeScript and a feature-based structure under `src/features/instagram-analysis`.
- Parser and analysis logic are pure, typed modules independent from React.
- ZIP support uses `fflate` with an extraction filter so unrelated archive entries are not decompressed.
- The obsolete `gh-pages` dependency and scripts were removed. Deployment now uses official GitHub Pages Actions.
- New dependencies were added for TypeScript, Prettier, PWA generation, Vitest, React Testing Library, jest-axe, and Playwright.
- A normal `npm audit fix` was used after dependency updates; `npm audit fix --force` was not used.
- `npm audit` reported zero vulnerabilities after the dependency update.
- The production app includes a CSP meta policy, no remote assets, no analytics, and a PWA service worker limited to static app-shell assets.
- Coverage thresholds are enforced at 80% for statements, branches, functions, and lines.
