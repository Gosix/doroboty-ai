# Optional PostHog for the Netlify test fork

The owner confirmed the EU project region. This integration belongs to https://dorobotyproject.netlify.app/, not the separately developed local recruiter application. No real project token is included. Publishing the source does not verify a Netlify deployment or live event receipt.

## Scope

One `$pageview` for initial display and each HashRouter pathname transition. React StrictMode repeats and query-only changes do not produce duplicates. Dynamic job/company/application identifiers become fixed route templates. Unknown paths become `/unknown`.

No autocapture, replay, surveys, automatic errors/performance, person profiles or identity calls. Forms, notes, CVs, persona information, query strings and referrers are not sent. Persistent tracking storage is disabled; generated identifiers are temporary, so reloads affect visitor counts. Do not describe these counts as exact unique people or retention. This does not enable PostHog's separate cookieless mode or require its project-level switch.

The SDK is lazy-loaded only on the approved hostname with valid enabled configuration. Localhost and deploy previews remain disabled. A blocked SDK cannot break recruitment. This initial version does not track arbitrary clicks, successful applications or purchases.

## Netlify build variables

Apply only to the owner's test project, with variables available during the production build:

| Variable               | Value                                                       |
| ---------------------- | ----------------------------------------------------------- |
| `VITE_POSTHOG_ENABLED` | `true`                                                      |
| `VITE_POSTHOG_KEY`     | The owner's **public project token**, beginning with `phc_` |
| `VITE_POSTHOG_HOST`    | `https://eu.i.posthog.com`                                  |

Get the public project token from the intended project at https://eu.posthog.com/. Never use a personal `phx_` key, password or server secret. Vite exposes `VITE_` settings in the public browser bundle. The example has no real token and defaults to disabled.

After the source change is reviewed and saved in GitHub, Netlify must build and publish the new commit with these values. Changing settings does not alter an already built JavaScript file. The earlier published `index-Db8ZjHjq.js` contained no PostHog integration. A changed hostname requires reviewing the explicit host boundary in `src/app/analytics.ts`.

## Live verification after owner approval

1. Confirm that the published Netlify commit contains the new SDK dependency and observer. Appearance can be identical.
2. Open the test site, then jobs and a job detail; use synthetic data only.
3. In browser Network, inspect requests to `eu.i.posthog.com`. If an extension blocks analytics, compare in a separate browser/profile; do not disable organization security protections.
4. In the intended EU project, inspect recent `$pageview` events, with old filters cleared. Check `app = doroboty-ai-case`, `page_name` and `route`.
5. Verify that routes use templates and contain no raw slugs, IDs, query strings or private text. Replay stays disabled.

If events are missing, check the actual published commit, enabled flag, token, EU host and hostname first. Then examine the specific network error, selected PostHog project, filters and time range. A successful ingestion response does not alone prove the intended project received the event.

Automated tests mock the SDK: no events are sent to PostHog. Actual receipt remains unverified until the owner configures and publishes the deployment.

Official references: https://posthog.com/docs/libraries/js, https://posthog.com/docs/libraries/js/config, https://posthog.com/docs/api, https://vite.dev/guide/env-and-mode, https://docs.netlify.com/build/configure-builds/environment-variables/.
