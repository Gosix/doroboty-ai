import { describe, expect, it, vi } from "vitest";
import type { CaptureResult } from "posthog-js/dist/module.no-external";
import {
  analyticsOptions,
  analyticsSettings,
  createPageviewTracker,
  safePage,
  sanitizePageview,
} from "./analytics";

const enabled = {
  VITE_POSTHOG_ENABLED: "true",
  VITE_POSTHOG_KEY: "phc_fake_test_project_not_a_real_token",
  VITE_POSTHOG_HOST: "https://eu.i.posthog.com",
};
const hostname = "dorobotyproject.netlify.app";

describe("optional PostHog EU analytics", () => {
  it("does not load or send anything without explicit valid configuration", async () => {
    const load = vi.fn();
    for (const env of [
      {},
      { ...enabled, VITE_POSTHOG_ENABLED: "false" },
      { ...enabled, VITE_POSTHOG_KEY: "" },
      { ...enabled, VITE_POSTHOG_KEY: "phx_personal_key" },
    ]) {
      await createPageviewTracker(env, hostname, load)("/");
    }
    expect(load).not.toHaveBeenCalled();
  });

  it("does not enable localhost, alternate domains, previews or a non-EU endpoint", () => {
    for (const host of [
      "localhost",
      "127.0.0.1",
      "preview--dorobotyproject.netlify.app",
      "dorobotyproject.netlify.app.evil.invalid",
    ])
      expect(analyticsSettings(enabled, host)).toBeNull();
    expect(
      analyticsSettings({ ...enabled, VITE_POSTHOG_HOST: "https://us.i.posthog.com" }, hostname),
    ).toBeNull();
    expect(analyticsSettings(enabled, hostname)).toEqual({
      key: enabled.VITE_POSTHOG_KEY,
      host: enabled.VITE_POSTHOG_HOST,
    });
  });

  it("records the first page and pathname transitions once, including StrictMode repeats", async () => {
    const sdk = { init: vi.fn(), capture: vi.fn() };
    const load = vi.fn().mockResolvedValue({ default: sdk });
    const track = createPageviewTracker(enabled, hostname, load);
    await Promise.all([track("/"), track("/"), track("/oferty")]);
    await track("/oferty");
    await track("/");
    expect(load).toHaveBeenCalledTimes(1);
    expect(sdk.init).toHaveBeenCalledOnce();
    expect(sdk.capture.mock.calls.map(([, props]) => props.route)).toEqual(["/", "/oferty", "/"]);
  });

  it("redacts dynamic job, company and application identifiers, queries and unknown paths", () => {
    expect(safePage("/oferty/private-job?email=private@example.invalid")).toEqual({
      page_name: "job",
      route: "/oferty/:slug",
    });
    expect(safePage("/app/kandydaci/private-id")).toEqual({
      page_name: "candidate_application",
      route: "/app/kandydaci/:id",
    });
    expect(safePage("/app/aplikacje/private-id/wyslano").route).toBe("/app/aplikacje/:id/wyslano");
    expect(safePage("/firmy/private-company").route).toBe("/firmy/:slug");
    expect(safePage("/unknown/private-name")).toEqual({
      page_name: "not_found",
      route: "/unknown",
    });
  });

  it("still counts separate jobs as separate views while sending no raw slug", async () => {
    const sdk = { init: vi.fn(), capture: vi.fn() };
    const track = createPageviewTracker(enabled, hostname, async () => ({ default: sdk }));
    await track("/oferty/first-private-slug");
    await track("/oferty/second-private-slug");
    expect(sdk.capture).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(sdk.capture.mock.calls)).not.toContain("private-slug");
  });

  it("drops extra SDK properties, raw URLs, referrers and all unapproved events", () => {
    const event: CaptureResult = {
      uuid: "00000000-0000-4000-8000-000000000000",
      event: "$pageview",
      $set: { email: "private@example.invalid" },
      $set_once: { notes: "Private application text" },
      properties: {
        route: "/oferty/:slug",
        token: "phc_fake_test_project_not_a_real_token",
        distinct_id: "sdk-generated-id",
        $session_id: "sdk-session-id",
        $current_url: "https://example.invalid/?email=private@example.invalid",
        $referrer: "https://example.invalid/private?token=secret",
        email: "private@example.invalid",
        notes: "Private application text",
      },
    };
    const result = sanitizePageview(event);
    expect(result?.properties.$current_url).toBe(
      "https://dorobotyproject.netlify.app/#/oferty/:slug",
    );
    expect(result?.properties.token).toBe("phc_fake_test_project_not_a_real_token");
    expect(result?.properties.distinct_id).toBe("sdk-generated-id");
    expect(JSON.stringify(result)).not.toMatch(/private@example|secret|Private application/);
    expect(result?.properties.$process_person_profile).toBe(false);
    expect(result?.properties.$geoip_disable).toBe(true);
    expect(sanitizePageview({ ...event, event: "$autocapture" })).toBeNull();
    expect(sanitizePageview({ ...event, properties: { route: "/private/path" } })).toBeNull();
  });

  it("disables replay, automatic capture, profiles and persistent tracking storage", () => {
    expect(analyticsOptions).toMatchObject({
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_exceptions: false,
      disable_session_recording: true,
      disable_surveys: true,
      advanced_disable_feature_flags: true,
      person_profiles: "never",
      persistence: "memory",
      disable_persistence: true,
    });
  });

  it("keeps the workflow usable if the analytics asset is blocked", async () => {
    const load = vi.fn().mockRejectedValue(new Error("blocked analytics"));
    const track = createPageviewTracker(enabled, hostname, load);
    await expect(track("/")).resolves.toBeUndefined();
    await expect(track("/oferty")).resolves.toBeUndefined();
  });
});
