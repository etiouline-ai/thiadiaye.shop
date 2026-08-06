"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

export function ImageGallery({ images }: { images: { url: string }[] }) {
  const [active, setActive] = useState(0);
  const current = images[active]?.url ?? null;
  const thumbnails = useMemo(() => images, [images]);

  if (!current) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-ink-100 text-8xl">
        🛒
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-ink-100">
        <Image
          src={current}
          alt="Photo de l'annonce"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
      {thumbnails.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {thumbnails.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === active
                  ? "border-brand-600"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
