"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect } from "react";

/**
 * Forces light theme on the home page and any non-chronicle routes.
 * Dark mode is only allowed on /chronicle and its sub-routes.
 */
export function ForceLightOutsideChronicle() {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const isChronicle = pathname?.startsWith("/chronicle");

  useEffect(() => {
    if (!isChronicle && resolvedTheme === "dark") {
      setTheme("light");
    }
  }, [isChronicle, resolvedTheme, setTheme]);

  return null;
}
