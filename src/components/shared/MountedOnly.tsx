"use client";

import { useEffect, useState, ReactNode } from "react";

/**
 * A utility component that only renders its children on the client-side.
 * This prevents hydration mismatches for components that depend on 
 * browser-only APIs (localStorage, window, etc.) or environment-specific 
 * formatting (toLocaleDateString).
 */
export default function MountedOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <>{children}</>;
}
