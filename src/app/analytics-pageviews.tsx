import { useEffect } from "react";
import { useLocation } from "react-router";
import { trackPageview } from "./analytics";

export function AnalyticsPageviews() {
  const { pathname } = useLocation();
  useEffect(() => {
    void trackPageview(pathname);
  }, [pathname]);
  return null;
}
