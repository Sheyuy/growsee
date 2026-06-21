"use client";

import { useEffect } from "react";

/**
 * UserSyncEffect — simplified placeholder.
 * Mini-program auto-login via WeChat means no manual sync needed.
 */
export function UserSyncEffect() {
  useEffect(() => {
    // No-op: mini-program handles auth via WeChat automatically
    console.log("[UserSyncEffect] auth handled by WeChat mini-program");
  }, []);

  return null;
}
