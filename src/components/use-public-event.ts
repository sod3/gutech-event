"use client";
import { useEffect, useState } from "react";
import type { PublicEvent } from "@/lib/types";
import { api } from "./ui";

// Keep registration availability current without resetting any form fields.
export function usePublicEvent(initialEvent: PublicEvent) {
  const [event, setEvent] = useState(initialEvent);
  useEffect(() => {
    let cancelled = false;
    let pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState !== "visible") return;
      pending = true;
      try {
        const latest = await api<PublicEvent>("/api/event");
        if (!cancelled) setEvent(latest);
      } catch {
        // A temporary network error must not erase a student's draft.
      } finally {
        pending = false;
      }
    };
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return event;
}
