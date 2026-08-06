import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

type SeedCategory = {
  slug: string;
  name: string;
  icon?: string;
  description?: string;
  children?: { slug: string; name: string }[];
};

const categories: SeedCategory[] = [
  {
    slug: "vehicules",
    name: "Véhicules",
    icon: "🚗",
    description: "Voitures, motos, locations et pièces",
    children: [
      { slug: "voitures", name: "Voitures" },
      { slug: "motos-scooters", name: "Motos & scooters" },
      { slug: "location-vehicules", name: "Location de véhicules" },
      { slug: "equipements-pieces", name: "Équipements & pièces" },
    ],
  },
  {
    slug: "immobilier",
    name: "Immobilier",
    icon: "🏠",
    description: "Terrains, maisons, appartements, chambres",
    children: [
      { slug: "terrains-a-vendre", name: "Terrains à vendre" },
      { slug: "maisons-a-vendre", name: "Maisons à vendre" },
      { slug: "maisons-a-louer", name: "Maisons à louer" },
      { slug: "appartements", name: "Appartements" },
      { slug: "chambres-a-louer", name: "Chambres à louer" },
    ],
  },
  {
    slug: "agriculture-elevage",
    name: "Agriculture & Élevage",
    icon: "🌾",
    description: "Matériel agricole, animaux, volailles, semences",
    children: [
      { slug: "materiel-agricole", name: "Matériel agricole" },
      { slug: "animaux-elevage", name: "Animaux & élevage" },
      { slug: "volailles", name: "Volailles" },
      { slug: "produits-agricoles", name: "Produits agricoles" },
    ],
  },
  {
    slug: "electronique-multimedia",
    name: "Électronique & Multimédia",
    icon: "📱",
    description: "Téléphones, ordinateurs, TV, consoles",
    children: [
      { slug: "telephones", name: "Téléphones" },
      { slug: "ordinateurs-tablettes", name: "Ordinateurs & tablettes" },
      { slug: "tv-home-cinema", name: "TV & home cinéma" },
      { slug: "consoles-jeux", name: "Consoles & jeux vidéo" },
      { slug: "accessoires-electronique", name: "Accessoires" },
    ],
  },
  {
    slug: "maison-electromenager",
    name: "Maison & Électroménager",
    icon: "🏡",
    description: "Électroménager, mobilier, décoration",
    children: [
      { slug: "electromenager", name: "Électroménager" },
      { slug: "climatisation", name: "Climatisation" },
      { slug: "mobilier", name: "Mobilier" },
      { slug: "decoration", name: "Décoration" },
    ],
  },
  {
    slug: "mode-beaute",
    name: "Mode & Beauté",
    icon: "👗",
    description: "Vêtements, chaussures, cosmétiques",
    children: [
      { slug: "vetements-homme", name: "Vêtements homme" },
      { slug: "vetements-femme", name: "Vêtements femme" },
      { slug: "chaussures", name: "Chaussures" },
      { slug: "cosmetiques", name: "Cosmétiques & parfums" },
      { slug: "bijoux-accessoires", name: "Bijoux & accessoires" },
    ],
  },
  {
    slug: "bebe-enfant",
    name: "Bébé & Enfant",
    icon: "🧸",
    description: "Puériculture, vêtements et jouets",
    children: [
      { slug: "puericulture", name: "Puériculture" },
      { slug: "vetements-enfant", name: "Vêtements enfant" },
      { slug: "jouets", name: "Jouets" },
    ],
  },
  {
    slug: "emploi-services",
    name: "Emploi & Services",
    icon: "💼",
    description: "Offres d'emploi, cours, prestations",
    children: [
      { slug: "offres-emploi", name: "Offres d'emploi" },
      { slug: "prestations-service", name: "Prestations de service" },
      { slug: "cours-particuliers", name: "Cours particuliers" },
    ],
  },
  {
    slug: "alimentation-agroalimentaire",
    name: "Alimentation",
    icon: "🍚",
    description: "Produits alimentaires, agroalimentaire",
    children: [
      { slug: "produits-alimentaires", name: "Produits alimentaires" },
      { slug: "restauration", name: "Restauration" },
    ],
  },
  {
    slug: "sports-loisirs",
    name: "Sports & Loisirs",
    icon: "⚽",
    description: "Équipement sportif, vélos, voyages",
    children: [
      { slug: "materiel-sport", name: "Matériel de sport" },
      { slug: "velos", name: "Vélos" },
    ],
  },
  {
    slug: "materiaux-outils",
    name: "Matériaux & Outils",
    icon: "🔧",
    description: "Construction, énergie, équipements",
    children: [
      { slug: "materiel-construction", name: "Matériel de construction" },
      { slug: "energie-groupes", name: "Énergie & groupes électrogènes" },
      { slug: "outillage", name: "Outillage" },
    ],
  },
  {
    slug: "artisanat-made-in-senegal",
    name: "Artisanat & Made in Sénégal",
    icon: "🎨",
    description: "Artisanat, maroquinerie, créations locales",
    children: [
      { slug: "artisanat-decoration", name: "Artisanat & décoration" },
      { slug: "maroquinerie", name: "Maroquinerie" },
    ],
  },
];

async function main() {
  console.log("Suppression des données existantes...");
  await prisma.payment.deleteMany();
  await prisma.image.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log("Création des catégories...");
  for (const cat of categories) {
    const parent = await prisma.category.create({
      data: {
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
      },
    });
    for (const child of cat.children ?? []) {
      await prisma.category.create({
        data: {
          slug: child.slug,
          name: child.name,
          parentId: parent.id,
        },
      });
    }
  }

  console.log("Création de l'admin...");
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash("Admin@2026", 12);
  await prisma.user.create({
    data: {
      email: "admin@thiadiaye.shop",
      passwordHash,
      name: "Administrateur",
      role: Role.ADMIN,
      phone: "+221 77 000 00 00",
    },
  });

  console.log("Seed terminé ✅");
  console.log("  Admin : admin@thiadiaye.shop / Admin@2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
