# THIADIAYE.SHOP

Portail d'annonces locales du Sénégal (modèle Expat-Dakar) : mise en relation acheteur / vendeur. Bâti avec Next.js, PostgreSQL et Prisma, pensé pour la performance, la sécurité et le mobile.

## Fonctionnalités

- Annonces illimitées par catégorie (Véhicules, Immobilier, Agriculture, Électronique, Maison, Emploi, Services…)
- Recherche plein-texte insensible aux accents (extension PostgreSQL `unaccent`)
- Filtres : catégorie, ville, prix, tri, pagination
- Upload d'images (max 2 Mo/image, 5 par annonce, conversion WebP via sharp)
- Mise à la une payante : Orange Money / Wave / Free Money (CinetPay en production, mode `mock` en local)
- Comptes utilisateurs (JWT httpOnly) et administration avec modération des annonces
- Confirmation d'email et réinitialisation de mot de passe (SMTP ou log local)
- Pages légales : CGU, confidentialité, mentions légales

## Stack

| Composant | Choix |
|---|---|
| Framework | Next.js 16 (App Router, server actions) |
| Langage | TypeScript |
| Base de données | PostgreSQL 16 (Docker) |
| ORM | Prisma 6 |
| Styles | Tailwind CSS v4 |
| Paiement | CinetPay (Orange Money / Wave / Free Money) |
| Stockage images | Local (dev) / compatible S3 (prod) |

## Démarrage local

Prérequis : Node.js 20+, Docker.

```bash
# 1. Base de données
docker run -d --name thiadiaye-postgres \
  -e POSTGRES_USER=thiadiaye -e POSTGRES_PASSWORD=thiadiaye \
  -e POSTGRES_DB=thiadiaye_shop -p 5432:5432 \
  -v thiadiaye-pgdata:/var/lib/postgresql/data \
  postgres:16-alpine

# 2. Dépendances
npm install

# 3. Variables d'environnement
cp .env.example .env   # puis renseignez JWT_SECRET
JWT_SECRET : node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Schéma + extension unaccent + index de recherche
npx prisma db push
Get-Content prisma\indexes.sql | docker exec -i thiadiaye-postgres psql -U thiadiaye -d thiadiaye_shop -v ON_ERROR_STOP=1
npm run db:seed

# 5. Lancer
npm run dev
```

Comptes seedés : `admin@thiadiaye.shop` / `Admin@2026` (changer après la 1re connexion).

## Commandes utiles

```bash
npm run dev        # serveur de développement
npm run build      # build de production
npm run start      # serveur de production
npm run lint       # eslint
npx tsx scripts/integration-test.ts   # test d'intégration (payments, upload, permissions)
```

## Tests

Le test d'intégration couvre : création utilisateur/annonce, upload d'image, tarification de la mise en avant (300 FCFA/jour, 7 jours = 2100 FCFA), confirmation webhook, refus d'accès d'un non-propriétaire, signature HMAC CinetPay et nettoyage complet des données. Le script est idempotent (reprise après échec possible).

Autres vérifications :
```bash
node scripts/verify-moderation.mjs     # visibilité publique + recherche sans accents
npx tsx scripts/verify-email-flow.ts   # confirmation d'email, reset de mot de passe, jetons à usage unique
npx tsx scripts/verify-upload-route.ts # route de servation d'images (nécessite le serveur lancé)
```

## Déploiement (production)

### 1. Base de données
PostgreSQL managé (Neon, Supabase, Railway, Render…). Renseignez `DATABASE_URL`, puis :
```bash
npx prisma db push   # ou npx prisma migrate deploy
```
Créer l'extension sur la base distante : `CREATE EXTENSION IF NOT EXISTS unaccent;`

### 2. Variables d'environnement
| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL |
| `JWT_SECRET` | Secret de signature des sessions (64 octets hex) |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site (HTTPS) |
| `MAX_UPLOAD_BYTES`, `MAX_IMAGES_PER_LISTING` | Limites d'upload |
| `PAYMENT_PROVIDER` | `mock` ou `cinetpay` |
| `PAYMENT_MODE` | `sandbox` ou `production` |
| `CINETPAY_API_KEY`, `CINETPAY_SITE_ID` | Identifiants marchand CinetPay |
| `CINETPAY_SECRET_KEY` | Clé secrète pour vérifier le webhook (`x-token` HMAC) |
| `EMAIL_DRIVER` | `log` (écrit dans `data/emails/`) ou `smtp` |
| `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Envoi réel d'emails |
| `STORAGE_DRIVER` | `local` ou `s3` |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Stockage compatible S3 (R2, MinIO, Backblaze…) |

### 3. Hébergement
- **Vercel** : importez le dépôt Git, renseignez les variables, puis `npx prisma generate` en build. Note : les fichiers sont éphémères sur serverless → utilisez `STORAGE_DRIVER=s3`.
- **VPS / Docker** : `npm run build && npm run start`, reverse-proxy Nginx/Caddy avec TLS (HTTPS). Les images restent en local.

### 4. HTTPS
- Vercel/Railway : TLS géré automatiquement.
- VPS : Caddy (auto-renouvellement Let's Encrypt) ou Nginx + certbot. Toutes les réponses sont déjà sécurisées (CSP, nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy).

## Sécurité

- Mots de passe hachés (bcrypt), sessions JWT en cookie `httpOnly` + `SameSite=Lax`
- Validation stricte des entrées (zod) côté serveur
- Rate limiting mémoire sur l'upload et l'upload d'images
- Headers : CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- Uploads : validation type/taille, conversion WebP, suppression à la suppression de l'annonce
- Modération humaine : les annonces sont `PENDING` tant que l'administrateur ne les publie pas

## Structure

```
prisma/schema.prisma    Modèle de données
prisma/seed.ts          Catégories + admin
src/lib/                Infrastructure (db, auth, validations, storage, rate-limit, payments)
src/actions/            Server actions (auth, listings, payments)
src/app/                Pages (annonces, compte, admin, auth, pages légales)
src/app/api/            Routes API (uploads, webhook paiement)
src/components/         Composants UI
scripts/                Tests et utilitaires
```
