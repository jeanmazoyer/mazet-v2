# Domaine : outil de gestion interne

Application interne pour le domaine (mariages, séjours). Le produit, l'ordre de construction
et les règles sont dans [BRIEF.md](./BRIEF.md).

## État actuel : étape 1 (socle)

- Thème vert sauge, barre latérale repliable, interface FR/EN.
- Connexion Google, limitée aux comptes actifs de la base.
- Rôles (administrateur, gestionnaire, partenaire) vérifiés côté serveur (`src/lib/permissions.ts`).
- Journal en ajout seul, protégé par trigger SQL (`src/db/migrations/0001_journal_immutable.sql`).
- Écran Dossiers avec données **fictives** (`src/features/dossiers/fixtures.ts`).

## Installation locale

Prérequis : Node 22, PostgreSQL 16.

```bash
npm install
cp .env.example .env.local      # puis renseigner les valeurs
npm run db:migrate
npm run db:seed                 # comptes de démo fictifs (@example.com)
npm run dev
```

Les variables sont décrites dans `.env.example`. Aucun secret ne doit être commité.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm test` | Tests : droits, rôles et journal (base réelle), contraste AA |
| `npm run typecheck` | Vérification des types |
| `npm run lint` | ESLint |
| `npm run build` | Build de production |
| `npm run db:generate` | Génère une migration après modification de `src/db/schema.ts` |
