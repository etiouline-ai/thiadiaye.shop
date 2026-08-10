"use client";

import { useCallback, useEffect, useState } from "react";
import { banners, BANNER_INTERVAL_MS } from "@/lib/banners";

export function HeroSlider() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % banners.length);
  }, []);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + banners.length) % banners.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, BANNER_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {banners.map((banner, i) => (
        <div
          key={banner.src}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${banner.src})` }}
        />
      ))}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {banners.map((banner, i) => (
          <button
            key={banner.src}
            type="button"
            aria-label={`Bannière ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-sun-400" : "w-2 bg-white/60 hover:bg-white"
            }`}
          />
        ))}
      </div>
      <button
        type="button"
        aria-label="Bannière précédente"
        onClick={prev}
        className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 px-3 py-2 text-xl font-bold text-white backdrop-blur transition hover:bg-white/40 sm:block"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Bannière suivante"
        onClick={next}
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 px-3 py-2 text-xl font-bold text-white backdrop-blur transition hover:bg-white/40 sm:block"
      >
        ›
      </button>
    </div>
  );
}
