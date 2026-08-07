import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Applique extensions + index de recherche sur la base cible (DATABASE_URL).
// Idempotent : peut être relancé sans risque.
async function main() {
  const statements = [
    'CREATE EXTENSION IF NOT EXISTS unaccent',
    'CREATE EXTENSION IF NOT EXISTS pg_trgm',
    `CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
      RETURNS text AS $$
        SELECT public.unaccent('public.unaccent', $1)
      $$ LANGUAGE sql IMMUTABLE PARALLEL SAFE`,
    `CREATE INDEX IF NOT EXISTS "listing_title_trgm"
      ON "Listing" USING gin (public.immutable_unaccent(lower(title)) gin_trgm_ops)`,
    `CREATE INDEX IF NOT EXISTS "listing_description_trgm"
      ON "Listing" USING gin (public.immutable_unaccent(lower(description)) gin_trgm_ops)`,
  ];

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.split("\n")[0].slice(0, 60));
    } catch (e) {
      console.error("ÉCHEC:", stmt.split("\n")[0].slice(0, 60), "-", (e as Error).message);
    }
  }
  console.log("Base de données prête (extensions + index).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
