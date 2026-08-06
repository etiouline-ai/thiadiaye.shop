"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createListing, updateListing } from "@/actions/listings";
import { CITIES } from "@/lib/cities";

type CategoryOption = {
  slug: string;
  name: string;
  icon?: string | null;
  children: { slug: string; name: string }[];
};

type ListingFormProps = {
  categories: CategoryOption[];
  edit?: {
    id: string;
    title: string;
    description: string;
    price: number | null;
    condition: string;
    categorySlug: string;
    city: string;
    district: string | null;
    phone: string | null;
    whatsapp: string | null;
  };
};

const MAX_IMAGES = 5;

export function ListingForm({ categories, edit }: ListingFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const list = Array.from(newFiles).slice(0, MAX_IMAGES);
    const urls = list.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...list].slice(0, MAX_IMAGES));
    setPreviews((prev) => [...prev, ...urls].slice(0, MAX_IMAGES));
    if (fileInput.current) fileInput.current.value = "";
  }

  function removeImage(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[i]);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.delete("image");
    files.forEach((file, i) => formData.append(`image${i}`, file));
    startTransition(async () => {
      const result = edit
        ? await updateListing(edit.id, formData)
        : await createListing(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/compte`);
      router.refresh();
    });
  }

  return (
    <form
      action={handleSubmit}
      className="mx-auto max-w-2xl space-y-5 rounded-xl border border-ink-200 bg-white p-6"
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          ⚠️ {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-semibold text-ink-700">
          Titre de l'annonce *
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={edit?.title}
          placeholder="Ex : Iphone 13 128 Go neuf sous garantie"
          className="w-full rounded-lg border border-ink-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-semibold text-ink-700">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={20}
          maxLength={5000}
          rows={5}
          defaultValue={edit?.description}
          placeholder="Décrivez l'article : état, année, raison de la vente, prix négociable…"
          className="w-full rounded-lg border border-ink-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-semibold text-ink-700">
            Prix (FCFA)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step={50}
            defaultValue={edit?.price ?? ""}
            placeholder="Ex : 150000"
            className="w-full rounded-lg border border-ink-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <div>
          <label htmlFor="condition" className="mb-1 block text-sm font-semibold text-ink-700">
            État *
          </label>
          <select
            id="condition"
            name="condition"
            defaultValue={edit?.condition ?? "USED"}
            className="w-full rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="NEW">Neuf</option>
            <option value="USED">D'occasion</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="categorySlug" className="mb-1 block text-sm font-semibold text-ink-700">
            Catégorie *
          </label>
          <select
            id="categorySlug"
            name="categorySlug"
            required
            defaultValue={edit?.categorySlug ?? ""}
            className="w-full rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="" disabled>
              Choisir une catégorie…
            </option>
            {categories.map((cat) => (
              <optgroup key={cat.slug} label={`${cat.icon ?? ""} ${cat.name}`}>
                <option value={cat.slug}>{cat.name}</option>
                {cat.children.map((child) => (
                  <option key={child.slug} value={child.slug}>
                    {cat.name} — {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-semibold text-ink-700">
            Ville / localité *
          </label>
          <select
            id="city"
            name="city"
            required
            defaultValue={edit?.city ?? "Thiadiaye"}
            className="w-full rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="district" className="mb-1 block text-sm font-semibold text-ink-700">
          Quartier / adresse (optionnel)
        </label>
        <input
          id="district"
          name="district"
          maxLength={80}
          defaultValue={edit?.district ?? ""}
          placeholder="Ex : Marché central, Thiadiaye"
          className="w-full rounded-lg border border-ink-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-ink-700">
            Téléphone de contact *
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={edit?.phone ?? ""}
            placeholder="Ex : +221771234567"
            className="w-full rounded-lg border border-ink-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <div>
          <label htmlFor="whatsapp" className="mb-1 block text-sm font-semibold text-ink-700">
            WhatsApp (optionnel)
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            defaultValue={edit?.whatsapp ?? ""}
            placeholder="Ex : +221771234567"
            className="w-full rounded-lg border border-ink-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-semibold text-ink-700">
          Photos ({previews.length}/{MAX_IMAGES})
        </span>
        <div className="flex flex-wrap gap-3">
          {previews.map((src, i) => (
            <div key={src} className="relative h-20 w-20 overflow-hidden rounded-lg border border-ink-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white"
              >
                ✕
              </button>
            </div>
          ))}
          {previews.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-ink-300 text-xs text-ink-500 hover:border-brand-500 hover:text-brand-600"
            >
              📷
              <span>Ajouter</span>
            </button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {previews.length === 0 && (
          <p className="mt-2 text-xs text-ink-400">
            JPEG, PNG ou WebP — 2 Mo max par photo, jusqu'à {MAX_IMAGES} photos.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
      >
        {pending
          ? "Publication en cours…"
          : edit
            ? "Enregistrer les modifications"
            : "Publier mon annonce gratuitement"}
      </button>
    </form>
  );
}
