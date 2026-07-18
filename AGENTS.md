# Agent Notes

- Preserve the no-backend privacy model. Do not add analytics, telemetry, account login, Instagram login, scraping, private API usage, or follow/unfollow automation.
- Keep imported data in memory only. Do not persist relationship data or log usernames/file contents.
- Use synthetic usernames in tests and docs.
- Parser and analysis logic live in `src/features/instagram-analysis/` and should stay independent from React.
- Run `npm run format:check`, `npm run typecheck`, `npm run lint`, `npm run test:coverage`, `npm run build`, and `npm run test:e2e` before handing off production changes.
- GitHub Pages uses the `/instascope/` base path. Keep PWA scope, start URL, tests, and metadata aligned with that path.
