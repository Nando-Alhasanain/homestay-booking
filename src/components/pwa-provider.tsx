"use client";

import { useEffect } from "react";

export function PWAProvider() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      return Promise.all(registrations.map((registration) => registration.unregister()));
    }).catch(() => {
      // Silent fail for browsers/environments that block service worker access.
    });

    if ("caches" in window) {
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((name) => caches.delete(name)));
      }).catch(() => {
        // Cache cleanup is best-effort only.
      });
    }
  }, []);

  return null;
}
