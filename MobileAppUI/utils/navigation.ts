import type { Href, Router } from "expo-router";

export const resetToRoute = (router: Router, href: Href) => {
  router.replace(href);
};

export const goBackOrFallback = (router: Router, fallback: Href) => {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
};