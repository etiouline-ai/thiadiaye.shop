import { saveImage, deleteFile } from "../src/lib/storage";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

async function main() {
  const saved = await saveImage(png, "image/png");
  const res = await fetch(`http://localhost:3000${saved.url}`);
  console.log("GET", saved.url, "→", res.status, res.headers.get("content-type"), "|", res.headers.get("cache-control"));
  const body = await res.arrayBuffer();
  console.log("Taille réponse:", body.byteLength, "octets");
  await deleteFile(saved.url);
  const res2 = await fetch(`http://localhost:3000${saved.url}`);
  console.log("Après suppression →", res2.status);
}
main().catch((e) => { console.error(e); process.exit(1); });
