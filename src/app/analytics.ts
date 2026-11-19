import type { CaptureResult, PostHog, PostHogConfig } from "posthog-js/dist/module.no-external";

const SITE_HOST = "dorobotyproject.netlify.app";
const EU_API_HOST = "https://eu.i.posthog.com";

type AnalyticsEnv = {
  VITE_POSTHOG_ENABLED?: string;
  VITE_POSTHOG_KEY?: string;
  VITE_POSTHOG_HOST?: string;
};

const routes = [
  ["home", "/", /^\/$/],
  ["jobs", "/oferty", /^\/oferty\/?$/],
  ["job", "/oferty/:slug", /^\/oferty\/[^/]+\/?$/],
  ["company", "/firmy/:slug", /^\/firmy\/[^/]+\/?$/],
  ["methodology", "/metodologia", /^\/metodologia\/?$/],
  ["privacy", "/polityka-prywatnosci", /^\/polityka-prywatnosci\/?$/],
  ["person_picker", "/auth/:mode", /^\/auth\/[^/]+\/?$/],
  ["application_editor", "/aplikuj/:slug", /^\/aplikuj\/[^/]+\/?$/],
  ["workspace", "/app", /^\/app\/?$/],
  ["profile", "/app/profil", /^\/app\/profil\/?$/],
  ["profile_preview", "/app/profil/podglad", /^\/app\/profil\/podglad\/?$/],
  ["saved_jobs", "/app/zapisane", /^\/app\/zapisane\/?$/],
  ["applications", "/app/aplikacje", /^\/app\/aplikacje\/?$/],
  ["application", "/app/aplikacje/:id", /^\/app\/aplikacje\/[^/]+\/?$/],
  [
    "application_confirmation",
    "/app/aplikacje/:id/wyslano",
    /^\/app\/aplikacje\/[^/]+\/wyslano\/?$/,
  ],
  ["employer_jobs", "/app/oferty", /^\/app\/oferty\/?$/],
  ["job_editor", "/app/oferty/:id", /^\/app\/oferty\/[^/]+\/?$/],
  ["organization", "/app/organizacja", /^\/app\/organizacja\/?$/],
  ["candidates", "/app/kandydaci", /^\/app\/kandydaci\/?$/],
  ["candidate_application", "/app/kandydaci/:id", /^\/app\/kandydaci\/[^/]+\/?$/],
  ["case", "/app/case", /^\/app\/case\/?$/],
  ["settings", "/app/settings", /^\/app\/settings\/?$/],
] as const;

export function safePage(pathname: string) {
  const path = pathname.split(/[?#]/)[0];
  const match = routes.find(([, , pattern]) => pattern.test(path));
  return match
    ? { page_name: match[0], route: match[1] }
    : { page_name: "not_found", route: "/unknown" };
}

export function analyticsSettings(env: AnalyticsEnv, hostname: string) {
  const key = env.VITE_POSTHOG_KEY?.trim();
  const host = (env.VITE_POSTHOG_HOST || EU_API_HOST).replace(/\/$/, "");
  if (
    env.VITE_POSTHOG_ENABLED !== "true" ||
    hostname !== SITE_HOST ||
    !key ||
    !/^phc_[a-zA-Z0-9_-]+$/.test(key) ||
    host !== EU_API_HOST
  ) {
    return null;
  }
  return { key, host };
}

export function sanitizePageview(event: CaptureResult | null): CaptureResult | null {
  if (!event || event.event !== "$pageview") return null;
  const page = routes.find(([, route]) => route === event.properties.route);
  const unknown = event.properties.route === "/unknown";
  if (!page && !unknown) return null;
  const route = page?.[1] || "/unknown";
  // Preserve the SDK public ingestion token as well as generated IDs and fixed routes.
  const properties: CaptureResult["properties"] = {
    app: "doroboty-ai-case",
    page_name: page?.[0] || "not_found",
    route,
    $current_url: `https://${SITE_HOST}/#${route}`,
    $pathname: route,
    $host: SITE_HOST,
    $process_person_profile: false,
    $geoip_disable: true,
    $lib: "web",
  };
  for (const key of [
    "token",
    "distinct_id",
    "$device_id",
    "$session_id",
    "$window_id",
    "$lib_version",
  ]) {
    if (typeof event.properties[key] === "string") properties[key] = event.properties[key];
  }
  return { uuid: event.uuid, event: "$pageview", timestamp: event.timestamp, properties };
}

export const analyticsOptions: Partial<PostHogConfig> = {
  api_host: EU_API_HOST,
  ui_host: "https://eu.posthog.com",
  defaults: "2026-08-30",
  autocapture: false,
  capture_pageview: false,
  capture_pageleave: false,
  capture_dead_clicks: false,
  capture_exceptions: false,
  capture_heatmaps: false,
  capture_performance: false,
  disable_session_recording: true,
  enable_recording_console_log: false,
  disable_surveys: true,
  advanced_disable_feature_flags: true,
  advanced_disable_feature_flags_on_first_load: true,
  person_profiles: "never",
  persistence: "memory",
  disable_persistence: true,
  before_send: sanitizePageview,
};

type AnalyticsClient = Pick<PostHog, "capture">;
type AnalyticsLoader = () => Promise<{ default: Pick<PostHog, "init" | "capture"> }>;

export function createPageviewTracker(env: AnalyticsEnv, hostname: string, load: AnalyticsLoader) {
  const settings = analyticsSettings(env, hostname);
  let client: Promise<AnalyticsClient> | null = null;
  let previousPath: string | null = null;
  return async (pathname: string) => {
    if (!settings || previousPath === pathname) return;
    previousPath = pathname;
    try {
      client ??= load().then(({ default: sdk }) => {
        sdk.init(settings.key, analyticsOptions);
        return sdk;
      });
      const sdk = await client;
      sdk.capture("$pageview", safePage(pathname));
    } catch {
      // A blocked analytics asset must not break recruitment or expose input data.
      previousPath = null;
      client = null;
    }
  };
}

export const trackPageview = createPageviewTracker(
  {
    VITE_POSTHOG_ENABLED: import.meta.env.VITE_POSTHOG_ENABLED,
    VITE_POSTHOG_KEY: import.meta.env.VITE_POSTHOG_KEY,
    VITE_POSTHOG_HOST: import.meta.env.VITE_POSTHOG_HOST,
  },
  typeof window === "undefined" ? "" : window.location.hostname,
  () => import("posthog-js/dist/module.no-external"),
);
