# Security Policy

## Supported Versions

Security fixes target the current `main` branch and the latest released version.

## Reporting a Vulnerability

Please do not open a public issue with sensitive details. Use GitHub private vulnerability reporting if it is enabled for the repository. If it is not enabled, contact the maintainer privately and include:

- A short description of the issue.
- Steps to reproduce with synthetic data.
- Browser and operating system details.
- Whether imported data could be exposed, persisted, or transmitted.

Do not attach real Instagram exports.

## Threat Model

InstaScope is designed as a static browser app. Its primary security goals are:

- Relationship files remain on the user's device.
- Imported data is not sent to external services.
- Imported data is not persisted by default.
- The service worker caches only static application assets.
- Usernames are validated before profile URLs are constructed.
- CSV exports are generated locally.

Out of scope:

- Compromised browsers or devices.
- Malicious browser extensions.
- Users manually sharing exported results.
- Changes made by Instagram after an export is downloaded.
