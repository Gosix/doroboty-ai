# Optional analytics for the participant test site

## Intent

The owner published this teaching fork at https://dorobotyproject.netlify.app/ to learn event tracking. The deployed bundle and current source contain no analytics SDK. Add an explicitly enabled PostHog EU integration to this fork, without changing the separately developed local recruiter application.

The owner confirmed https://eu.posthog.com/ as the project region. No project token has been supplied. Local verification must not change Netlify settings or send real telemetry. On 2026-11-18 the owner subsequently authorized publishing this prepared integration to Gosix/doroboty-ai on GitHub. Netlify configuration and live event receipt remain separate verification steps.

## Acceptance criteria

- Disabled without an explicit build-time flag, a public project token and the approved test hostname. Localhost and deploy previews remain disabled.
- One sanitized $pageview for initial display and each hash-router pathname transition; do not duplicate React StrictMode effects or query-only changes.
- No form values, person selection, job/application IDs or slugs, route query strings, full referrers, profiles, notes, CVs, replay, autocapture or identity calls.
- Use PostHog EU; persistent tracking storage is disabled. Anonymous identifiers are temporary and reloads can affect visitor counts.
- Analytics failures never prevent the teaching workflow. Tests mock the SDK and make no real ingestion requests.
- Include exact Netlify build variables, a fresh-build requirement, verification steps and the remaining live-verification boundary.
- Update the current behavior register and explain the optional exception to the frontend-only/no-external-requests baseline.

## Verification

Local checks completed with Node 24.22.3: 35 unit tests (including 8 mocked analytics tests), lint, TypeScript/build, baseline packet validation, formatting and the unchanged design-system reference/tests. The build retains existing Zod annotation and bundle-size warnings.

CUA browser smoke on the separate local preview passed for home, hash routing and the updated privacy notice, with no console warnings/errors. The small-screen notice fit at 312 CSS px without horizontal overflow. Analytics remained off, with no real project token or ingestion test.

Publication verification on 2026-11-18: ./scripts/verify passed formatting, design-system checks, lint, types, all 35 unit tests, packet validation and build, then the browser stage was blocked by sandbox port permissions. A separate elevated browser run confirmed missing Chromium. After provisioning Playwright Chromium in a temporary directory (without OS dependency installation), all 34 existing E2E journeys passed. The two changed Markdown documents were rechecked for formatting before commit. Live PostHog receipt is still unverified; no real token was used.

Separate source review checked the explicit hostname/EU boundary, absent live credentials, strict event/property allowlist, dynamic route redaction, StrictMode deduplication, retained hash routes/local state and the participant-package documentation links. Netlify settings were not changed during local verification. Live receipt remains unverified until the owner configures and deploys the reviewed code.
