# Contributing

Thanks for helping improve InstaScope.

## Ground Rules

- Preserve the browser-only privacy model.
- Do not add a backend, database, analytics, telemetry, login, Instagram login, scraping, or private API integration.
- Do not add follow or unfollow automation.
- Do not commit real Instagram exports, usernames, metrics, screenshots containing personal data, or generated build output.
- Keep examples and tests synthetic.

## Development

```bash
npm ci
npm run dev
```

Before opening a pull request:

```bash
npm run format:check
npm run typecheck
npm run lint
npm run test:coverage
npm run build
npm run test:e2e
```

## Pull Requests

- Use focused, conventional commits when practical.
- Explain user-facing behavior changes.
- Include tests for parser, import, accessibility, or UI changes when relevant.
- Update README or docs when behavior changes.

## Reporting Parser Issues

If Instagram changes its export structure, create a minimal synthetic JSON example that mirrors the shape. Never upload a real export.
