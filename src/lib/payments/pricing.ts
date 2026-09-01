export const FEATURED_PRICE_PER_DAY_FCFA = 300;
export const FEATURED_MIN_DAYS = 7;
export const FEATURED_MAX_DAYS = 30;

export const SHOP_CREATION_PRICE_FCFA = Number(
  process.env.SHOP_CREATION_PRICE_FCFA ?? 5000,
);

export const PAYMENT_METHODS = [
  { value: "ORANGE_MONEY", label: "Orange Money", color: "#ff7900" },
  { value: "WAVE", label: "Wave", color: "#1dc8ef" },
  { value: "FREE_MONEY", label: "Free Money", color: "#e2001a" },
  { value: "CARD", label: "Carte bancaire", color: "#6b7280" },
] as const;

export function featuredPriceFCFA(days: number): number {
  return FEATURED_PRICE_PER_DAY_FCFA * days;
}
