"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function ScrollReset() {
  const path = usePathname();
  useEffect(() => {
    if (!window.location.hash)
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [path]);
  return null;
}
