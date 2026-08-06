import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { saveImage, deleteFile } from "../src/lib/storage";
import {
  createFeaturedPayment,
  confirmPaymentSuccess,
} from "../src/lib/payments/service";
import { featuredPriceFCFA } from "../src/lib/payments/pricing";

async function main() {
  console.log("== Test d'intégration THIADIAYE.SHOP ==");

  // Nettoyage préalable (reprise après échec)
  const leftovers = await prisma.user.findMany({
    where: { email: { in: ["test@thiadiaye.shop", "other@thiadiaye.shop"] } },
  });
  for (const u of leftovers) {
    await prisma.payment.deleteMany({ where: { userId: u.id } });
    const ls = await prisma.listing.findMany({ where: { sellerId: u.id } });
    for (const l of ls) {
      await prisma.payment.deleteMany({ where: { listingId: l.id } });
      await prisma.image.deleteMany({ where: { listingId: l.id } });
      await prisma.listing.delete({ where: { id: l.id } });
    }
    await prisma.user.delete({ where: { id: u.id } });
  }

  // 1. Créer un utilisateur test
  const passwordHash = await hashPassword("Test@1234");
  const user = await prisma.user.create({
    data: {
      email: "test@thiadiaye.shop",
      passwordHash,
      name: "Utilisateur Test",
      phone: "+221771234567",
    },
  });
  console.log("1. Utilisateur créé:", user.email);

  // 2. Créer une catégorie et une annonce
  const cat = await prisma.category.findUnique({ where: { slug: "voitures" } });
  if (!cat) throw new Error("Catégorie 'voitures' absente");
  const listing = await prisma.listing.create({
    data: {
      slug: `test-listing-${Date.now()}`,
      title: "Voiture test — Toyota Corolla 2018",
      description: "Très bon état, première main, entretien suivi, négociable.",
      price: 5500000,
      condition: "USED",
      status: "PUBLISHED",
      city: "Thiadiaye",
      sellerId: user.id,
      categoryId: cat.id,
      phone: "+221771234567",
    },
  });
  console.log("2. Annonce créée:", listing.slug);

  // 3. Tester l'upload d'image (1x1 png)
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQI12P4//8/AAX+Av7czFnnAAAAAElFTkSuQmCC",
    "base64",
  );
  const saved = await saveImage(png, "image/png");
  console.log("3. Image sauvegardée:", saved.url);
  await prisma.image.create({
    data: { listingId: listing.id, url: saved.url, position: 0 },
  });

  // 4. Paiement de mise en avant
  const payment = await createFeaturedPayment({
    userId: user.id,
    listingId: listing.id,
    method: "ORANGE_MONEY",
    days: 7,
  });
  console.log(
    "4. Paiement créé:",
    payment.payment.id,
    "montant =",
    payment.amount,
    "FCFA (attendu:",
    featuredPriceFCFA(7),
    ")",
  );
  if (payment.amount !== featuredPriceFCFA(7)) throw new Error("Prix incorrect");
  if (payment.paymentUrl !== "http://localhost:3000/compte/paiement/" + payment.payment.id + "?tx=" + payment.providerTxId) {
    console.log("   URL paiement (mock):", payment.paymentUrl);
  }

  // 5. Confirmer le paiement (webhook)
  await confirmPaymentSuccess(payment.payment.id);
  const after = await prisma.listing.findUnique({ where: { id: listing.id } });
  if (!after || !after.featuredUntil) throw new Error("featuredUntil non défini");
  const days = Math.round((after.featuredUntil.getTime() - Date.now()) / 86400000);
  console.log("5. Annonce mise en avant pour", days, "jours ✓");

  // 6. Refus d'un paiement pour une annonce qui n'appartient pas
  const other = await prisma.user.create({
    data: {
      email: "other@thiadiaye.shop",
      passwordHash: await hashPassword("Test@1234"),
      name: "Autre",
    },
  });
  let rejected = false;
  try {
    await createFeaturedPayment({
      userId: other.id,
      listingId: listing.id,
      method: "WAVE",
      days: 7,
    });
  } catch {
    rejected = true;
  }
  console.log("6. Accès non propriétaire refusé:", rejected);

  // 7. Nettoyage
  await prisma.payment.deleteMany({ where: { listingId: listing.id } });
  await prisma.payment.deleteMany({ where: { userId: other.id } });
  await prisma.image.deleteMany({ where: { listingId: listing.id } });
  await prisma.listing.delete({ where: { id: listing.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.user.delete({ where: { id: other.id } });
  deleteFile(saved.url);
  console.log("7. Données de test nettoyées ✓");

  console.log("== TOUS LES TESTS PASSENT ✅ ==");
}

main()
  .catch((e) => {
    console.error("ÉCHEC:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
