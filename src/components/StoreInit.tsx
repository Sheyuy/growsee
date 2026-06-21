"use client";

import { useEffect, useState } from "react";
import { initStore } from "@/lib/demo/store";

/**
 * Ensures demo data is loaded into localStorage before children render.
 * Wraps the app so every screen can safely call getChildren() etc.
 * synchronously after mount.
 */
export function StoreInit({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStore().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-primary)" }} />
      </div>
    );
  }

  return <>{children}</>;
}
