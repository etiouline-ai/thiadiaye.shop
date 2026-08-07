"use client";

import { useEffect } from "react";
import { adsClientId } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({
  slot,
  className,
  label,
}: {
  slot: string;
  className?: string;
  label?: string;
}) {
  useEffect(() => {
    if (!adsClientId || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense:", e);
    }
  }, [slot]);

  if (!adsClientId || !slot) return null;

  return (
    <div className={className} aria-label={label ?? "Publicité"}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adsClientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
