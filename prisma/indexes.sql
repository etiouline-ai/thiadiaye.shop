-- Index de recherche plein-texte (trigrammes + insensible aux accents)
-- À exécuter après un prisma db push / migrate deploy (superuser requis).

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enveloppe IMMUTABLE de unaccent (PostgreSQL refuse d'indexer une fonction STABLE)
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent('public.unaccent', $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

CREATE INDEX IF NOT EXISTS "listing_title_trgm"
  ON "Listing" USING gin (public.immutable_unaccent(lower(title)) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "listing_description_trgm"
  ON "Listing" USING gin (public.immutable_unaccent(lower(description)) gin_trgm_ops);
