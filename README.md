# InstaScope

InstaScope is a privacy-first browser app for analyzing official Instagram relationship exports. It compares followers and following data to show mutual connections, accounts that do not follow you back, and followers you do not follow back.

No backend. No account login. No Instagram API. No scraping. Your files stay in your browser.

## Features

- Import the official Instagram ZIP export directly.
- Import multiple JSON files, including paginated `followers_1.json`, `followers_2.json`, and `following_1.json`.
- Manual two-field JSON import fallback.
- Parse supported followers and following export shapes with runtime validation.
- Case-insensitive username comparison with deterministic duplicate removal.
- Search, sort, paginate, copy, and locally export CSV results.
- Light, dark, and system theme preference.
- Offline app shell after first successful load.
- Accessible status, warning, error, tab, and keyboard interaction patterns.

## Screenshots

Screenshots are intentionally left as placeholders until release images are captured from the deployed GitHub Pages build.

- Initial import state: placeholder.
- Completed analysis state: placeholder.
- Dark theme state: placeholder.

## Privacy Model

InstaScope processes relationship data entirely in the browser.

- Imported files are read with browser file APIs.
- Relationship data is kept in memory only.
- The app persists only the theme preference in `localStorage`.
- CSV exports are generated locally with a Blob URL.
- The service worker caches only the app shell and static assets.
- There is no analytics, telemetry, advertising SDK, upload endpoint, backend, database, authentication, Instagram login, scraping, or private API use.

## Supported Export Structures

InstaScope supports:

- Followers files whose top-level value is an array.
- Followers objects containing `relationships_followers`.
- Following objects containing `relationships_following`.
- Entries where the username is in `title`.
- Entries where the username is in `string_list_data[0].value`.
- Optional `href` and `timestamp` fields.
- Multiple follower pages such as `followers_1.json`, `followers_2.json`, and `followers_3.json`.
- Following files named `following.json` or `following_1.json`.
- Empty but structurally valid exports.

Malformed, unrelated, reversed, oversized, HTML, corrupt ZIP, and invalid JSON files produce inline errors or warnings.

## Export From Instagram

Instagram's official Help Center currently describes the flow as Accounts Center, Your information and permissions, Export your information, Create export, and Export to device: [Review and export a copy of your Instagram information](https://help.instagram.com/181231772500920/).

Recommended settings for InstaScope:

- Select only Followers and Following.
- Choose JSON format, not HTML.
- Choose All time when you want a complete comparison.
- Download the export ZIP and import it directly into InstaScope.

Inside the ZIP, the useful files are usually under:

```text
connections/followers_and_following/
  followers_1.json
  followers_2.json
  following.json
```

## ZIP Import

1. Open InstaScope.
2. Drop the official Instagram ZIP archive onto the import area, or choose it with the file picker.
3. Select Analyze selected export.

Large full-account archives can be slow or too large for a browser tab. If InstaScope warns that a file is too large, request a smaller export containing only Followers and Following in JSON format.

## Manual JSON Import

Use the manual fallback when you have already extracted the ZIP:

1. Open Manual JSON import fallback.
2. Select one or more followers files.
3. Select the following file.
4. Select Analyze manual JSON files.

## Local Development

Requires Node.js 22 LTS. This repository pins `22.16.0` in `.nvmrc` and accepts compatible Node 22 or 24 LTS runtimes through `engines`.

```bash
npm ci
npm run dev
```

The Vite dev server uses the GitHub Pages base path:

```text
http://127.0.0.1:5173/instascope/
```

## Scripts

- `npm run dev` - start Vite locally.
- `npm run build` - build the production app.
- `npm run preview` - preview the production build.
- `npm run typecheck` - run strict TypeScript checks.
- `npm run lint` - run ESLint.
- `npm run format` - format with Prettier.
- `npm run format:check` - verify formatting.
- `npm test` - run Vitest unit and component tests.
- `npm run test:coverage` - run tests with coverage thresholds.
- `npm run test:e2e` - run Playwright against the built app under `/instascope/`.
- `npm run check` - run format check, typecheck, lint, unit tests, and build.

## Architecture

```text
src/
  app/                         App shell and theme preference
  components/                  Shared UI components
  features/
    instagram-analysis/
      components/              Import, status, stats, tabs, and results UI
      analysis.ts              Pure set comparison logic
      import.ts                Browser file, ZIP, and multi-file pipeline
      parser.ts                Runtime guards and normalization
      csv.ts                   Local CSV generation
      types.ts                 Domain types
  shared/                      Browser actions for copy/download
  styles/                      Global design system
  test/                        Test environment setup
```

Parser and comparison logic are independent from React and covered by focused tests.

## Testing

The automated suite uses Vitest, React Testing Library, user-event, jest-axe, and Playwright.

```bash
npm run format:check
npm run typecheck
npm run lint
npm run test:coverage
npm run build
npm run test:e2e
```

Synthetic fixtures live under `test-fixtures/instagram`. Do not commit real Instagram data.

## Deployment

The app is built for GitHub Pages at `/instascope/`.

- Pull requests and pushes run `.github/workflows/ci.yml`.
- Main-branch deployments run `.github/workflows/pages.yml`.
- Deployment uses the official Pages artifact flow: `configure-pages`, `upload-pages-artifact`, and `deploy-pages`.
- Pull requests are never deployed.

## Offline Behavior

InstaScope uses Vite PWA generation to cache the app shell and static assets. User-selected files and relationship data are never cached by the service worker.

## Troubleshooting

- HTML export error: request the export again and choose JSON.
- No followers files found: include `followers_1.json` or import the official ZIP.
- No following file found: include `following.json` or `following_1.json`.
- Files reversed: put followers files in the followers field and the following file in the following field.
- File too large: export only Followers and Following.
- Empty results: the export may be valid but contain zero records, or your active search filter may match nothing.

## Browser Support

InstaScope targets modern evergreen browsers with File, Blob, Clipboard, Web Worker, service worker, and ES module support.

## Security Notes

Please report suspected vulnerabilities privately using the process in [SECURITY.md](SECURITY.md). Do not attach real Instagram exports to public issues.

## Limitations

- InstaScope only analyzes official export files supplied by the user.
- It does not follow, unfollow, message, scrape, or modify Instagram accounts.
- It cannot verify live Instagram state.
- Instagram export structure may change; unsupported structures should be reported with synthetic examples.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

## Non-Affiliation

InstaScope is not affiliated with, endorsed by, or sponsored by Meta or Instagram.
