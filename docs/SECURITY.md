# Prototype data boundary

This static frontend has no trusted server or real authentication. Role-specific UI and local transition checks organize the scenario; anyone using the browser can inspect all stored data. Use synthetic data only.

No API keys, credentials, real CVs or private material belong in frontend source, JSON, localStorage or exports. Exports include private-in-the-UI source/recruiter notes.

Exception: optional analytics accepts a public PostHog project token in build configuration, never a personal key or server secret. It is restricted to the test hostname and EU ingestion, default-off, with sanitized route metadata and temporary generated IDs. It must not export scenario records, private text or persona identities. See [PostHog setup](POSTHOG.md).

Render imported text through React text nodes, validate imports with shared Zod schemas, reject unsupported versions, duplicate IDs, broken references and oversized files. Never overwrite an unreadable save automatically.
