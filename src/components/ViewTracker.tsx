"use client";

import { useEffect, useRef } from "react";
import { incrementViews } from "@/actions/listings";

export function ViewTracker({ slug }: { slug: string }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void incrementViews(slug);
  }, [slug]);

  return null;
}
