# Domaine : gestion des dossiers du domaine

Outil interne pour un domaine qui accueille des mariages, des événements et des locations
saisonnières : suivi des demandes en pipeline, fiches de dossier, contacts, activités,
messagerie. Le cahier des charges est dans [BRIEF.md](./BRIEF.md).

## Base du projet

Depuis le 17 novembre 2026, ce dépôt part de **warpdrive 2.8.1**, une alternative open source à
Pipedrive, sous licence MIT (© 2026 Nikita Sawinyh). Le fichier [LICENSE](./LICENSE) est conservé
tel quel, comme la licence l'exige. Le README d'origine est dans
[docs/warpdrive-README.md](./docs/warpdrive-README.md) et les conventions de développement dans
[CLAUDE.md](./CLAUDE.md).

L'application précédente (Next.js sur Vercel, avec calendrier, journal et rôles) reste dans
l'historique git, au commit `822f899`.

### Ce qui a été adapté

- **Connexion** : en plus du domaine Google Workspace, une liste d'adresses autorisées
  (`ALLOWED_LOGIN_EMAILS`) permet de se connecter avec un compte `gmail.com`.
- **Catalogue par défaut** : pipeline « Domaine » en six étapes (Demande, Visite, Option, Devis
  envoyé, Signé, Soldé) et étiquettes en français, dont le type de dossier (Mariage, Événement,
  Séjour, Autre). Tout reste modifiable dans les réglages.
- **Devise** : la devise de départ suit `BASE_CURRENCY` (euros par défaut). Elle était figée en
  dollars.
- **Pipeline sans défilement horizontal** : les colonnes se partagent la largeur et passent à la
  ligne.
- **Réglages par défaut** : télémétrie et vérification de mise à jour désactivées.
- **Tests sans Docker** : `TEST_PG_URL` permet de lancer les tests d'intégration sur un
  PostgreSQL déjà installé.

### Ce qui n'a pas été repris de l'archive

- `site/` et `docs-site/` : le site vitrine et la documentation publique de warpdrive.
- `.mcp.json` : il branchait un outil d'analyse externe avec une clé personnelle.
- Trois tests qui dépendaient de fichiers absents de l'archive (`.github/workflows/deploy.yml`,
  `scripts/auditConfig.ts`).

### Ce qui reste à faire

- **Français** : l'interface est en anglais. Les textes sont centralisés dans `src/constants/`,
  ce qui rend la traduction possible, mais c'est un chantier à part.
- **Calendrier et blocage des doubles réservations** : à porter depuis l'ancienne application.
- **Journal infalsifiable et rôle partenaire** : à rapprocher des permissions de warpdrive.
- **Tables de données** : elles défilent encore horizontalement quand il y a beaucoup de colonnes.
- **Messagerie Gmail** : elle exige un compte Google Workspace, pas un compte `gmail.com`.
- **Hébergement** : warpdrive se déploie avec Docker sur un serveur, pas sur Vercel. Voir
  [docs/deploy.md](./docs/deploy.md).

## Installation locale (macOS, sans Docker)

Prérequis : Node 24, pnpm 9 et PostgreSQL 16.

```bash
nvm install 24
corepack enable
brew install postgresql@16
brew services start postgresql@16
createdb domaine_dev
```

Installez les dépendances et créez le fichier de configuration :

```bash
pnpm install
cp .env.example .env
```

Renseignez `.env`. Pour un usage local, les valeurs utiles sont :

| Variable | Valeur locale |
| --- | --- |
| `BASE_URL` | `http://localhost:3000` |
| `DATABASE_URL` | `postgres://localhost:5432/domaine_dev` |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | votre client OAuth Google (URI de redirection : `http://localhost:3000/auth/callback`) |
| `GOOGLE_WORKSPACE_DOMAIN` | votre domaine Workspace, ou `domaine.invalid` si vous n'en avez pas |
| `ALLOWED_LOGIN_EMAILS` | les adresses Google autorisées, séparées par des virgules |
| `SEED_ADMIN_EMAIL` | l'adresse du premier administrateur |
| `ALLOW_FIRST_LOGIN_ADMIN` | `true` en local uniquement (active la connexion de développement) |
| `WS_PUBLIC_URL`, `NEXT_PUBLIC_WS_URL` | `ws://localhost:8080` |
| `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | `http://localhost:3900` et deux valeurs quelconques, si vous n'utilisez pas les fichiers |
| `MCP_ENABLED` | `false` |

Générez les trois secrets (une commande par variable) :

```bash
openssl rand -base64 32
```

Collez un résultat différent dans `WS_TICKET_SECRET`, `TOKEN_ENCRYPTION_KEY` et
`OAUTH_SIGNING_KEY`.

Créez les tables puis lancez l'application :

```bash
pnpm db:migrate
pnpm dev
```

Ouvrez http://localhost:3000. En local, avec `ALLOW_FIRST_LOGIN_ADMIN=true`, vous pouvez entrer
sans Google par `http://localhost:3000/auth/dev-login?email=` suivi de l'adresse de
`SEED_ADMIN_EMAIL`. Cette route n'existe pas en production.

### Processus annexes (facultatifs en local)

Sans eux, l'application fonctionne, mais sans mise à jour en temps réel ni tâches de fond.

```bash
pnpm build:workers
node --env-file .env dist/ws.mjs
node --env-file .env dist/worker.mjs
```

L'envoi de fichiers demande en plus un stockage compatible S3 (Garage, fourni par
`docker-compose.dev.yml`).

## Commandes

| Commande | Rôle |
| --- | --- |
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production (exige `ALLOW_FIRST_LOGIN_ADMIN=false`) |
| `pnpm typecheck` | Vérification des types |
| `NODE_OPTIONS=--max-old-space-size=12288 pnpm lint` | Biome puis ESLint (ESLint manque de mémoire avec le réglage par défaut de Node) |
| `pnpm test:unit` | Tests unitaires, sans base de données |
| `TEST_PG_URL=postgres://$(whoami)@localhost:5432/postgres pnpm test:integration` | Tests d'intégration sur le PostgreSQL local (sinon Docker) |
| `pnpm db:migrate` | Applique les migrations |
| `pnpm db:seed:demo` | Jeu de démonstration de warpdrive (données de vente fictives, en anglais) |
