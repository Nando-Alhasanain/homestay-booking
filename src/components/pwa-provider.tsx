"use client";

import { useEffect } from "react";

export function PWAProvider() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silent fail for dev environments without HTTPS
      });
    }
  }, []);

  return null;
}
