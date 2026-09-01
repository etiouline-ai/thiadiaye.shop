"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveShop } from "@/actions/shops";
import { CITIES } from "@/lib/cities";
import { ShopPaymentPanel } from "@/components/ShopPaymentPanel";

type ShopFormProps = {
  shop?: {
    name: string;
    description: string | null;
    city: string | null;
    phone: string | null;
    whatsapp: string | null;
    website: string | null;
    facebook: string | null;
    instagram: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
  } | null;
};

const fieldClass =
  "w-full rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

function ImagePicker({
  label,
  hint,
  name,
  current,
}: {
  label: string;
  hint: string;
  name: string;
  current: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const shown = preview ?? current;

  function handleFile(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }

  function handleRemove() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div>
      <span className="mb-1 block text-sm font-semibold text-ink-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-ink-300 text-2xl hover:border-brand-500"
        >
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-ink-500">📷</span>
          )}
        </button>
        <div className="text-xs text-ink-400">
          <p>{hint}</p>
          {shown && (
            <button
              type="button"
              onClick={handleRemove}
              className="mt-1 font-semibold text-red-600 hover:underline"
            >
              Retirer l'image
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

export function ShopForm({ shop }: ShopFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdShop, setCreatedShop] = useState<{
    id: string;
    slug: string;
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await saveShop(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.requiresPayment) {
        setCreatedShop({ id: result.shopId ?? "", slug: result.shopSlug ?? "" });
        return;
      }
      router.push(`/boutique/${result.shopSlug}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {createdShop && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
          <p className="text-sm font-semibold text-brand-800">
            🎉 Votre boutique a été créée !
          </p>
          <p className="mt-1 text-sm text-brand-700">
            Elle est en attente de paiement. Réglez votre activation pour la
            rendre visible dans l'annuaire des boutiques. Vous pourrez ensuite
            la modifier à tout moment, gratuitement.
          </p>
          <div className="mt-4">
            <ShopPaymentPanel shopId={createdShop.id} />
          </div>
        </div>
      )}

      <form
        action={handleSubmit}
        className="mx-auto max-w-2xl space-y-5 rounded-xl border border-ink-200 bg-white p-6 shadow-sm"
      >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <span className="text-base">⚠️</span> {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-semibold text-ink-700">
          Nom de la boutique *
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          defaultValue={shop?.name}
          placeholder="Ex : Magasin Modou & Fils"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-semibold text-ink-700">
          Description (optionnel)
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={shop?.description ?? ""}
          placeholder="Présentez votre boutique : vos produits, vos services, vos horaires…"
          className={fieldClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-semibold text-ink-700">
            Ville / localité
          </label>
          <select
            id="city"
            name="city"
            defaultValue={shop?.city ?? ""}
            className={fieldClass}
          >
            <option value="">—</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-ink-700">
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={shop?.phone ?? ""}
            placeholder="Ex : +221771234567"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="whatsapp" className="mb-1 block text-sm font-semibold text-ink-700">
            WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            defaultValue={shop?.whatsapp ?? ""}
            placeholder="Ex : +221771234567"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="website" className="mb-1 block text-sm font-semibold text-ink-700">
            Site web
          </label>
          <input
            id="website"
            name="website"
            defaultValue={shop?.website ?? ""}
            placeholder="Ex : https://maboutique.sn"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="facebook" className="mb-1 block text-sm font-semibold text-ink-700">
            Page Facebook
          </label>
          <input
            id="facebook"
            name="facebook"
            defaultValue={shop?.facebook ?? ""}
            placeholder="Ex : facebook.com/maboutique"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="instagram" className="mb-1 block text-sm font-semibold text-ink-700">
            Instagram
          </label>
          <input
            id="instagram"
            name="instagram"
            defaultValue={shop?.instagram ?? ""}
            placeholder="Ex : @maboutique"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImagePicker
          label="Logo de la boutique"
          hint="JPEG, PNG ou WebP — 5 Mo max"
          name="logo"
          current={shop?.logoUrl ?? null}
        />
        <ImagePicker
          label="Bannière"
          hint="JPEG, PNG ou WebP — 5 Mo max"
          name="banner"
          current={shop?.bannerUrl ?? null}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
      >
        {pending
          ? "Enregistrement…"
          : shop
            ? "Enregistrer ma boutique"
            : "Créer ma boutique"}
      </button>
    </form>
    </div>
  );
}
