# Preserve the PostHog ingestion token

## Intent and acceptance

The owner reports no events in their intended EU project 352788. Earlier debugging incorrectly inspected project 357815. Do not change the public Netlify token on the basis of that unrelated project. The browser account currently available cannot access 352788, so event receipt there remains unverified.

Source review found that sanitizePageview removed properties.token. The pinned SDK inserts its public project token before before_send and sends the resulting event after that hook. Retain this routing field while continuing to strip form text, raw URLs, identity setters and all non-pageview events. No expansion of autocapture, replay or profiles.

## Evidence

The existing sanitizer regression was extended with the SDK token and reproduced the failure before the fix. The retained token is a public project key, not a personal API key. Review SYS-03 and rerun the repository verification gate. Full live receipt requires authorized access to the intended project; absence in the unrelated project is not evidence about delivery to 352788.

## Validation

The transport-token regression failed before the fix and passed after it. The complete ./scripts/verify gate passed: formatting, immutable kit checks, lint, types, 35 unit tests, baseline packet, production build and 34 E2E journeys. Separate diff review confirms only the public transport field was added to the existing allowlist; private text, identity setters and other events remain stripped. Tests did not send real ingestion requests.
