import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const admin = await p.user.findUnique({ where: { email: "admin@thiadiaye.shop" } });
  const cat = await p.category.findFirst({ where: { parentId: null } });

  const l = await p.listing.create({
    data: {
      title: "Vélo test modération",
      slug: "velo-test-moderation",
      description: "Annonce de test du flux de modération.",
      price: 25000,
      currency: "FCFA",
      city: "Dakar",
      district: "SACRÉ-CŒUR",
      categoryId: cat.id,
      sellerId: admin.id,
      phone: "771234567",
      status: "PENDING",
    },
  });

  const check = async (label, query) => {
    const res = await fetch(`http://localhost:3000/annonces?q=${encodeURIComponent(query)}`);
    const html = await res.text();
    const found = html.includes("Vélo test modération");
    console.log(`${label}: q="${query}" visible=${found}`);
    return found;
  };

  await check("AVANT approbation (PENDING)", "modération");

  await p.listing.update({ where: { id: l.id }, data: { status: "PUBLISHED" } });
  await check("APRÈS approbation (PUBLISHED)", "modération");
  await check("APRÈS approbation (sans accent)", "MODERATION");

  await p.image.deleteMany({ where: { listingId: l.id } });
  await p.listing.delete({ where: { id: l.id } });
  console.log("Nettoyé ✓");
  await p.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
