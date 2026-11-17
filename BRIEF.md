# Brief de démarrage : outil de gestion du domaine

> **Décision du 17 novembre 2026 : changement de base.** Le projet repart de warpdrive 2.8.1
> (open source, licence MIT), repris en entier puis adapté au domaine. Conséquences sur ce brief :
> - **Pile et hébergement (sections 2 et 8)** : Next.js, Drizzle et Postgres restent, mais
>   l'hébergement Vercel est abandonné. Warpdrive se déploie avec Docker sur un serveur, à
>   placer dans l'Union européenne.
> - **Interface (section 3)** : c'est celle de warpdrive. La règle « aucun défilement
>   horizontal » est conservée.
> - **Périmètre (section 4)** : le calendrier, les devis, l'échéancier, les pièces et la fiche
>   événement restent à construire ou à porter dans cette nouvelle base.
> - **Rôles et traçabilité (section 6)** : à rapprocher des permissions et de l'historique de
>   warpdrive. Le journal infalsifiable n'y existe pas encore.
> - **Langue** : l'interface de warpdrive est en anglais. La traduction reste à faire.
>
> L'état réel du dépôt est décrit dans README.md.


Document à placer à la racine du dépôt. Il décrit ce qu'on construit, dans quel ordre, et les règles à ne pas enfreindre.

## 1. Le produit en une phrase

Une application web interne pour un domaine familial qui accueille des mariages et des séjours : elle suit chaque demande jusqu'au solde, tient le planning, produit devis et contrats, collecte les pièces, et garde une trace de qui a fait quoi.

Hypothèses à confirmer avant de coder :

- L'outil sert un seul domaine (pas de multi-clients, pas d'abonnement).
- Trois à cinq utilisateurs internes, plus un ou deux partenaires externes en accès restreint.
- La clientèle est en grande partie étrangère : tout ce que voit un client existe en français et en anglais.

## 2. Pile technique

- Next.js (App Router) et TypeScript.
- Tailwind CSS et shadcn/ui pour les composants, Lucide pour les icônes.
- Postgres managé, hébergé dans l'Union européenne, avec un ORM typé.
- Connexion par compte Google, limitée à une liste d'adresses autorisées.
- Hébergement Vercel.

Vérifier les versions et les commandes d'installation dans la documentation officielle au moment de démarrer, plutôt que de les supposer.

## 3. Interface

Base : la structure d'application de shadcn/ui (barre latérale repliable, en-tête de page, onglets, tableaux, panneaux latéraux). Ne reprendre ni les écrans, ni les textes, ni le code d'un produit existant : on part des composants open source et on dessine nos propres écrans.

> **Décisions du 17 novembre 2026** :
> - L'interface suit la structure d'un CRM à pipeline : barre supérieure avec recherche et ajout rapide, navigation sombre à gauche, dossiers en colonnes par étape, fiche avec barre d'étapes, résumé et historique. Cette structure s'inspire du projet open source warpdrive (licence MIT). On ne reprend ni la marque, ni les textes, ni les visuels d'un produit commercial.
> - Le thème vert sauge ci-dessous est remplacé : navigation sombre, fond gris clair, cartes blanches, vert réservé à l'action principale et aux étapes franchies, modes clair et sombre. Les valeurs en vigueur sont dans `src/app/globals.css`. Le bloc qui suit est conservé pour mémoire.
> - Aucun défilement horizontal dans l'application.

Thème vert sauge sur fond crème, à poser dans les variables CSS du thème :

```css
:root {
  --background: oklch(0.985 0.008 95);
  --foreground: oklch(0.22 0.02 150);
  --card: oklch(0.995 0.005 95);
  --card-foreground: oklch(0.22 0.02 150);
  --primary: oklch(0.42 0.07 150);
  --primary-foreground: oklch(0.98 0.01 95);
  --secondary: oklch(0.95 0.015 130);
  --secondary-foreground: oklch(0.28 0.04 150);
  --muted: oklch(0.96 0.01 100);
  --muted-foreground: oklch(0.5 0.02 140);
  --accent: oklch(0.93 0.03 140);
  --accent-foreground: oklch(0.28 0.04 150);
  --border: oklch(0.9 0.012 110);
  --input: oklch(0.9 0.012 110);
  --ring: oklch(0.55 0.08 150);
  --sidebar: oklch(0.97 0.012 110);
  --sidebar-foreground: oklch(0.28 0.03 150);
  --sidebar-primary: oklch(0.42 0.07 150);
  --sidebar-primary-foreground: oklch(0.98 0.01 95);
  --sidebar-accent: oklch(0.93 0.03 140);
  --sidebar-border: oklch(0.9 0.012 110);
}
```

Ces valeurs sont un point de départ. Vérifier le contraste du texte sur chaque fond (niveau AA) et ajuster.

## 4. Périmètre de la V1

1. **Dossiers** : une fiche par demande, avec un statut (demande, visite, option, devis envoyé, signé, soldé, perdu), les contacts, la date visée, l'effectif, la source de la demande et un fil de notes.
2. **Calendrier** : un planning unique pour le domaine. Options avec date d'expiration. Blocage de toute double réservation. Export vers Google Agenda et import du calendrier Airbnb (flux iCal).
3. **Devis et contrats** : grille tarifaire (saisons, formules, extras). Le devis sort de la grille, le contrat sort du devis à partir d'un modèle. Export PDF en français et en anglais.
4. **Échéancier** : acompte, solde et caution par dossier, avec le statut de chaque ligne et des rappels à envoyer.
5. **Pièces** : liste de pièces attendues par dossier (contrat signé, attestation d'assurance, état des lieux), statut de chacune, et dépôt automatique dans un dossier Google Drive par événement.
6. **Fiche événement** : effectif, horaires, prestataires, hébergements, règles du site. Une page imprimable.
7. **Rôles et journal** : voir la section 6.

Hors V1 : espace client pour les mariés, boîte de réception unifiée, tableaux de bord, plan de salle.

## 5. Ce qu'on branche au lieu de le construire

- Signature électronique : un service dédié (Yousign par exemple).
- Paiement en ligne des acomptes : Stripe.
- Caution par empreinte bancaire : un service dédié (Swikly par exemple).
- Facturation : le logiciel de facturation ou de comptabilité existant. L'application ne fabrique pas de factures légales, elle suit les échéances.
- Stockage des documents : Google Drive.

En V1, ces branchements peuvent rester manuels : l'utilisateur colle le lien ou coche le statut. On les automatise ensuite, un par un.

## 6. Rôles et traçabilité

C'est la partie la plus importante du produit.

| Rôle | Peut faire | Ne peut pas faire |
| --- | --- | --- |
| Administrateur (famille) | Tout, y compris les tarifs, les modèles et les comptes | |
| Gestionnaire (famille) | Dossiers, prix, devis, contrats, échéancier, pièces | Gérer les comptes |
| Partenaire externe | Voir le planning et la fiche événement, ajouter un compte rendu | Voir les prix, créer ou envoyer un devis ou un contrat, modifier un dossier |

Règles :

- Les droits sont vérifiés côté serveur, jamais seulement dans l'interface.
- Chaque création, modification, export et envoi est écrit dans un journal avec l'auteur, la date et l'objet. Le journal ne se modifie pas et ne se supprime pas.
- Rien ne part chez un client sans action explicite d'un utilisateur de la famille.

## 7. Modèle de données de départ

- `User` : nom, e-mail, rôle.
- `Client` : contacts, langue, pays.
- `Dossier` : client, type (mariage, séjour, autre), statut, date visée, effectif, source, notes.
- `Reservation` : dossier, début, fin, type (option ou ferme), date d'expiration de l'option.
- `Tarif` : libellé, saison, unité, prix, taux de TVA.
- `Devis` et `LigneDevis` : dossier, version, lignes, totaux, statut.
- `Contrat` : dossier, devis d'origine, modèle, langue, statut de signature, lien du fichier.
- `Echeance` : dossier, nature (acompte, solde, caution), montant, date, statut.
- `Piece` : dossier, type, statut, identifiant du fichier Drive.
- `Journal` : auteur, action, objet, date, détail.

## 8. Garde-fous

- Aucun secret dans le dépôt : clés et jetons dans les variables d'environnement.
- Données personnelles de clients : hébergement dans l'Union européenne, accès limité aux comptes autorisés, pas de données réelles dans les jeux de test.
- Tests automatiques sur deux points critiques : l'impossibilité de double réservation et le respect des droits par rôle.
- Chaque étape se termine par une version déployée et utilisable.

## 9. Ordre de construction

1. Socle : projet, thème vert, barre latérale, connexion Google, rôles, journal. Données fictives.
2. Dossiers et suivi par statut.
3. Calendrier, options et blocage des doubles réservations.
4. Grille tarifaire, devis, contrat en PDF.
5. Échéancier et rappels.
6. Pièces et dépôt dans Google Drive.
7. Fiche événement et accès partenaire.
8. Branchements : signature, paiement, caution.

## 10. Première consigne à donner

> Lis BRIEF.md en entier. Avant d'écrire du code, liste les questions ou les choix techniques à trancher, propose la structure du projet, puis réalise uniquement l'étape 1 de la section 9 avec des données fictives. Montre-moi l'écran « Dossiers » dans le thème vert avant d'aller plus loin.
