import posthog from "posthog-js";

const posthogToken = import.meta.env.VITE_POSTHOG_KEY?.trim();
const posthogHost = import.meta.env.VITE_POSTHOG_HOST?.trim();

export const isPostHogInitialized = Boolean(posthogToken && posthogHost);

if (isPostHogInitialized) {
  posthog.init(posthogToken!, {
    api_host: posthogHost!,
    defaults: "2026-08-30",
    logs: {
      serviceName: "doroboty-ai-case-web",
      environment: import.meta.env.MODE,
    },
  });
} else if (import.meta.env.DEV) {
  const missingVariable = posthogToken ? "VITE_POSTHOG_HOST" : "VITE_POSTHOG_KEY";
  console.error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}

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

let previousPath: string | null = null;

export function trackPageview(pathname: string) {
  if (!isPostHogInitialized || previousPath === pathname) return;
  previousPath = pathname;
  posthog.capture("$pageview", safePage(pathname));
}

type LogAttributes = Record<string, boolean | number | string>;

export const posthogLogger = {
  info(message: string, attributes: LogAttributes) {
    if (!isPostHogInitialized) return;
    posthog.logger.info(message, attributes);
  },
};

export { posthog };
