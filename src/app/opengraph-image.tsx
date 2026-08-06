import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "THIADIAYE.SHOP — Annonces au Sénégal";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#15803d",
          color: "#ffffff",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 56, fontWeight: 800, letterSpacing: 1 }}>
          THIADIAYE.SHOP
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 800, lineHeight: 1.05 }}>
            Le portail d&apos;annonces
          </div>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 800, lineHeight: 1.05 }}>
            de Thiadiaye et du Sénégal
          </div>
          <div style={{ display: "flex", fontSize: 34, opacity: 0.9, marginTop: 28 }}>
            Achetez, vendez, publiez gratuitement près de chez vous.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, opacity: 0.85 }}>
          Véhicules · Immobilier · Agriculture · Électronique · Maison · Emploi · Services
        </div>
      </div>
    ),
    size,
  );
}
