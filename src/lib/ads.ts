// Configuration publicitaire Google AdSense.
// Renseignez NEXT_PUBLIC_ADSENSE_CLIENT_ID (ex: ca-pub-xxxxxxxxxxxxxxxx) pour activer.
export const adsClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";

export const adsSlots = {
  home: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME ?? "",
  list: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LIST ?? "",
  detail: process.env.NEXT_PUBLIC_ADSENSE_SLOT_DETAIL ?? "",
};
