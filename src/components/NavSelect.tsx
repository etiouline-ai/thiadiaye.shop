"use client";

import { useRouter } from "next/navigation";

type Option = { value: string; label: string };

export function NavSelect({
  options,
  value,
  ariaLabel,
}: {
  options: Option[];
  value: string;
  ariaLabel: string;
}) {
  const router = useRouter();

  return (
    <select
      aria-label={ariaLabel}
      defaultValue={value}
      onChange={(e) => {
        const v = e.target.value;
        if (v) router.push(v);
      }}
      className="rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
