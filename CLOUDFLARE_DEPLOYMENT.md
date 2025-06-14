# Déploiement sur Cloudflare Pages et Workers

## Prérequis

1. Compte Cloudflare
2. Wrangler CLI installé : `npm install -g wrangler`
3. Authentification : `wrangler auth login`

## Configuration Backend (Cloudflare Workers)

### 1. Créer la base de données D1

```bash
cd apps/server
wrangler d1 create open-bookmarks-db
```

Copier l'ID de la base de données et l'ajouter dans `apps/server/wrangler.toml` :

```toml
[[d1_databases]]
binding = "DB"
database_name = "open-bookmarks-db"
database_id = "VOTRE_DATABASE_ID_ICI"
```

### 2. Appliquer les migrations

```bash
cd apps/server
wrangler d1 execute open-bookmarks-db --file=./src/db/migrations/0001_initial.sql
```

### 3. Configurer les variables d'environnement

```bash
cd apps/server

# Variables secrètes
wrangler secret put DATABASE_URL
# Entrer: sqlite://local.db (pour la compatibilité, D1 sera utilisé en production)

wrangler secret put BETTER_AUTH_SECRET
# Entrer: une chaîne aléatoire de 32+ caractères

wrangler secret put GOOGLE_GENERATIVE_AI_API_KEY
# Entrer: votre clé API Google AI (optionnel)
```

### 4. Configurer les variables publiques

Dans le dashboard Cloudflare ou via wrangler :

```bash
wrangler secret put CORS_ORIGIN
# Entrer: https://votre-app.pages.dev

wrangler secret put BETTER_AUTH_URL  
# Entrer: https://votre-worker.votre-subdomain.workers.dev
```

### 5. Déployer le Worker

```bash
cd apps/server
bun install
bun run deploy
```

## Configuration Frontend (Cloudflare Pages)

### 1. Configurer les variables d'environnement

Dans le dashboard Cloudflare Pages, ajouter :

```
VITE_SERVER_URL=https://votre-worker.votre-subdomain.workers.dev
```

### 2. Déployer via Git (Recommandé)

1. Connecter votre repository GitHub/GitLab à Cloudflare Pages
2. Configuration de build :
   - **Build command**: `cd apps/web && bun install && bun run build`
   - **Build output directory**: `apps/web/dist`
   - **Root directory**: `/`

### 3. Déployer via CLI (Alternative)

```bash
cd apps/web
bun install
bun run build
wrangler pages deploy dist --project-name=open-bookmarks-web
```

## Configuration des domaines

### Backend Worker
- URL par défaut : `https://open-bookmarks-api.votre-subdomain.workers.dev`
- Domaine personnalisé : Configurer dans Cloudflare Dashboard > Workers & Pages

### Frontend Pages
- URL par défaut : `https://open-bookmarks-web.pages.dev`
- Domaine personnalisé : Configurer dans Cloudflare Dashboard > Pages

## Variables d'environnement finales

### Backend (Worker)
```bash
DATABASE_URL=sqlite://local.db  # Pour compatibilité, D1 utilisé en prod
CORS_ORIGIN=https://votre-app.pages.dev
BETTER_AUTH_SECRET=votre-secret-32-chars
BETTER_AUTH_URL=https://votre-worker.workers.dev
GOOGLE_GENERATIVE_AI_API_KEY=votre-cle-api  # Optionnel
```

### Frontend (Pages)
```bash
VITE_SERVER_URL=https://votre-worker.workers.dev
```

## Scripts utiles

```bash
# Développement local avec Cloudflare
cd apps/server && bun run dev:wrangler  # Worker en local
cd apps/web && bun run pages:dev        # Pages en local

# Déploiement
cd apps/server && bun run deploy        # Déployer Worker
cd apps/web && bun run deploy           # Déployer Pages

# Gestion D1
wrangler d1 execute open-bookmarks-db --command="SELECT * FROM todo"  # Query
wrangler d1 execute open-bookmarks-db --file=migration.sql            # Migration
```

## Troubleshooting

1. **Erreur CORS** : Vérifier que `CORS_ORIGIN` correspond exactement à l'URL de votre app Pages
2. **Erreur Database** : Vérifier que l'ID de la base D1 est correct dans `wrangler.toml`
3. **Erreur Auth** : Vérifier que `BETTER_AUTH_URL` correspond à l'URL de votre Worker
4. **Build Error** : Vérifier que toutes les dépendances sont installées avec `bun install` 