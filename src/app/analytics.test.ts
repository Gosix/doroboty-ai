import { describe, expect, it } from "vitest";
import { safePage } from "./analytics";

describe("optional PostHog EU analytics", () => {
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
});
