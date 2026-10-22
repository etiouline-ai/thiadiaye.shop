// Configuration publicitaire Google AdSense.
// Renseignez NEXT_PUBLIC_ADSENSE_CLIENT_ID (ex: ca-pub-xxxxxxxxxxxxxxxx) pour activer.
export const adsClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";

const home = process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME ?? "";
const list = process.env.NEXT_PUBLIC_ADSENSE_SLOT_LIST ?? "";
const detail = process.env.NEXT_PUBLIC_ADSENSE_SLOT_DETAIL ?? "";

// Chaque emplacement dédié retombe sur le slot de sa page s'il n'est pas défini.
export const adsSlots = {
  home,
  homeTop: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP || home,
  homeBottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_BOTTOM || home,
  list,
  listInline: process.env.NEXT_PUBLIC_ADSENSE_SLOT_LIST_INLINE || list,
  detail,
  detailBottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_DETAIL_BOTTOM || detail,
};
