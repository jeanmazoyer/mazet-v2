# Domaine : outil de gestion interne

Application interne pour le domaine (mariages, séjours). Le produit, l'ordre de construction
et les règles sont dans [BRIEF.md](./BRIEF.md).

## État actuel : étapes 1 à 3

- **Socle** : connexion Google limitée aux comptes actifs de la base, interface FR/EN, thème noir et blanc (clair et sombre).
- **Rôles** (administrateur, gestionnaire, partenaire) vérifiés côté serveur (`src/lib/permissions.ts`).
- **Journal** en ajout seul, protégé par trigger SQL (`src/db/migrations/0001_journal_immutable.sql`).
- **Dossiers** : tableau par statut (glisser-déposer, ou menu « Déplacer vers » au clavier et au toucher), vue liste, création, fiche avec contacts et fil de notes.
- **Calendrier** : planning mensuel, options avec date d'expiration, réservations fermes. La double réservation est interdite par une contrainte d'exclusion Postgres (`src/db/migrations/0003_reservations_no_overlap.sql`), pas seulement par le code.

Pas encore fait : export vers Google Agenda et import du calendrier Airbnb (iCal), puis les étapes 4 à 8 du brief.

## Installation locale

Prérequis : Node 22, PostgreSQL 16 (sur macOS : `brew install postgresql@16`, `brew services start postgresql@16`, puis `createdb mazet_dev` et `createdb mazet_test`).

```bash
npm install
cp .env.example .env.local      # puis renseigner les valeurs
npm run db:migrate
npm run db:seed                 # comptes de démo fictifs (@example.com)
npm run dev
```

Les variables sont décrites dans `.env.example`. Aucun secret ne doit être commité.

Points d'attention :

- `AUTH_SECRET` se génère avec `openssl rand -base64 32`. S'il est vide, la connexion échoue avec une erreur de configuration.
- La connexion passe par Google : il faut un client OAuth (console Google Cloud) avec l'URI de redirection `http://localhost:3000/api/auth/callback/google`.
- Les comptes de démo sont en `@example.com`. Pour vous connecter, ajoutez votre adresse Google dans la table `users`.
- Ne faites pas `source .env.local` dans le terminal : une variable déjà exportée dans le shell prend le pas sur le fichier.
- Après un `git pull`, relancez `npm run db:migrate`.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm test` | Tests : droits, journal, dossiers, double réservation (base réelle), contraste AA |
| `npm run typecheck` | Vérification des types |
| `npm run lint` | ESLint |
| `npm run build` | Build de production |
| `npm run db:generate` | Génère une migration après modification de `src/db/schema.ts` |
