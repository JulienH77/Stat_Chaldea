# Chaldea Command

Une interface web dédiée au suivi et à la comparaison de comptes **Fate/Grand Order (FGO) – serveur NA**.

Le projet transforme un suivi initialement réalisé dans Google Sheets / Excel en une interface de type **Chaldea / command room**, pensée pour consulter rapidement la collection, les niveaux de développement et la progression de plusieurs joueurs.

> **Projet personnel / communautaire** : les données affichées correspondent aux comptes enregistrés dans l'application et ne constituent pas une base officielle de FGO.

## Accès

- **Site web** : https://julienh77.github.io/Stat_Chaldea/
- **Dépôt GitHub** : https://github.com/JulienH77/Stat_Chaldea

## Fonctionnalités

### Overview

Le tableau de bord présente une vue synthétique de la progression du compte sélectionné.

On y retrouve notamment :

- le nombre de Servants possédés ;
- la répartition des Servants 5★, 4★ et Welfares ;
- la distribution des niveaux de Skills ;
- la moyenne des Skills 1, 2 et 3 ;
- le nombre de Servants Bond 10+ ;
- le nombre de Servants niveau 120 ;
- le pourcentage de Noble Phantasms au niveau 5 ;
- la progression de collection des 4★ / 5★ / Welfares.

La distribution des Skills peut être affichée selon deux périmètres :

- **ALL** : Servants 1★ à 5★ ;
- **GOLD** : 4★, 5★ et Welfares.

### Servants

L'onglet **Servants** permet de parcourir toute la liste des Servants du serveur NA.

Deux modes d'affichage sont disponibles :

- **Cards** : affichage visuel avec portrait, classe, rareté, niveau, NP et Graals ;
- **Table** : affichage compact pour parcourir de nombreuses entrées rapidement.

La liste propose :

- recherche par nom ;
- filtres multiples de classes ;
- filtres multiples de raretés ;
- tri par ordre de sortie, Bond, NP, niveau, ATK ou HP ;
- ordre croissant / décroissant ;
- distinction claire entre Servants possédés et non possédés.

Les données de progression peuvent inclure, selon le compte :

- niveau ;
- Bond ;
- Graals ;
- Fou HP / ATK ;
- NP Level ;
- Skills 1 à 3 ;
- Append Skills ;
- Servant Coins.

### Fiche Servant

Un clic sur un Servant ouvre une fiche détaillée présentant notamment :

- la classe et la rareté ;
- les quatre artworks d'ascension (3 ascensions + Final Ascension) ;
- niveau et nombre de Graals ;
- ATK / HP selon la progression renseignée ;
- NP Level ;
- Skills 1 / 2 / 3 ;
- Append Skills ;
- Bond ;
- les cinq Command Cards ;
- les informations complémentaires disponibles pour le Servant.

Les informations provenant du catalogue du jeu sont utilisées pour enrichir les fiches, tandis que les statistiques personnelles sont propres à chaque joueur.

### Compare

L'onglet **Compare** permet de comparer les trois comptes suivis dans l'application.

Il propose notamment :

- des statistiques globales ;
- le pourcentage de collection sur les 4★ / 5★ / Welfares ;
- les moyennes des Skills 1, 2 et 3 ;
- le pourcentage de NP 5 ;
- Bond 10+ ;
- niveau 120 ;
- un radar de progression ;
- le **Servant Showdown**, permettant de comparer directement un même Servant entre les différents comptes.

Le Showdown permet de consulter les niveaux, NP, Skills et Append Skills de chaque joueur et met visuellement en évidence les différences entre les comptes.

### Calcul XP

L'onglet **Calcul XP** sert à estimer les besoins en expérience pour faire progresser un Servant.

Il permet notamment de :

- définir un niveau actuel ;
- définir un niveau cible ;
- calculer l'XP nécessaire ;
- estimer le nombre de cartes d'XP nécessaires ;
- distinguer les cartes d'XP normales et les cartes correspondant à la classe ;
- suivre un inventaire de cartes d'XP par classe.

Des paliers rapides permettent de sélectionner facilement des objectifs comme 60, 70, 80, 90, 100 ou 120.

### Support Lists

Une section dédiée aux **Support Lists** est prévue pour suivre les supports des comptes.

Elle a vocation à regrouper les différentes configurations de supports normales et événementielles, notamment via les Friend IDs NA.

L'intégration automatique complète avec des services tiers peut dépendre de leurs mécanismes d'accès, de leurs restrictions réseau et de leur disponibilité.

## Comptes et mode lecture seule

L'application est pensée pour plusieurs utilisateurs.

Le principe est simple :

- chaque joueur dispose de son propre profil ;
- les autres visiteurs peuvent consulter les données ;
- un joueur connecté peut modifier ses propres statistiques ;
- il ne doit pas pouvoir modifier les statistiques des autres joueurs.

Dans l'interface, les champs deviennent éditables uniquement pour le compte correspondant aux droits de l'utilisateur connecté.

## Synchronisation des données

Le projet sépare les différentes sources de données :

```text
Catalogue / informations générales FGO
              │
              ▼
       données du Servant
              │
              ├── portraits
              ├── classe
              ├── rareté
              ├── Command Cards
              └── informations générales

Données personnelles des joueurs
              │
              ▼
            Supabase
              │
              ├── Julien
              ├── Yanis
              └── Attmann
```

Le dépôt GitHub héberge principalement l'interface et les données statiques nécessaires au fonctionnement initial de l'application.

La base Supabase sert de source persistante pour les données personnelles lorsqu'un compte est connecté.

Les sauvegardes des statistiques Servants sont réalisées par **mise à jour des lignes existantes** à partir de l'identifiant du joueur et de l'identifiant du Servant afin d'éviter de créer une nouvelle ligne à chaque sauvegarde.

## Données initiales

Le fichier `data/initial-state.json` sert de **snapshot initial / valeur de secours** pour les données de l'application.

Il ne remplace pas la base Supabase lorsque celle-ci est disponible.

Les fichiers d'import Excel ayant servi à construire les profils initiaux ne sont pas nécessaires pour le fonctionnement quotidien du site.

## Roster NA

Le projet est conçu pour suivre le **serveur NA**, et non l'intégralité du roster JP.

L'objectif est que les nouveaux Servants disponibles sur NA puissent être intégrés au catalogue sans devoir recréer manuellement tout le roster.

Les données de progression des joueurs restent indépendantes du catalogue : un nouveau Servant peut donc apparaître comme **non possédé** jusqu'à ce qu'un joueur renseigne son compte.

## Classes et raretés

Les classes utilisées dans l'interface comprennent les classes FGO standard ainsi que les classes Extra pertinentes pour le catalogue, avec notamment :

- Saber
- Archer
- Lancer
- Rider
- Caster
- Assassin
- Berserker
- Shielder
- Moon Cancer
- autres classes Extra présentes dans les données du jeu lorsque pertinentes pour le Servant.

Dans les statistiques de collection, **Mash / Shielder est traité à part** puisqu'il s'agit d'un Servant obligatoire et ne doit pas fausser les indicateurs de collection.

Les Welfares sont également suivis comme une catégorie distincte dans l'interface, indépendamment de leur rareté.

## Architecture

Le projet est volontairement léger afin de rester compatible avec GitHub Pages.

```text
Stat_Chaldea/
├── index.html
├── app.js
├── styles.css
├── config.js
├── supabase.sql
├── data/
│   ├── initial-state.json
│   └── ...
└── README.md
```

### Rôle des principaux fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Structure de l'application et chargement des ressources |
| `app.js` | Logique applicative, affichage, filtres, calculs et synchronisation |
| `styles.css` | Interface et responsive design |
| `config.js` | Configuration Supabase et options du projet |
| `data/initial-state.json` | Données initiales / fallback |
| `supabase.sql` | Schéma initial de la base Supabase |

## Déploiement

Le projet est compatible avec **GitHub Pages**.

Pour mettre à jour le site :

1. remplacer les fichiers nécessaires dans le dépôt GitHub ;
2. attendre la publication GitHub Pages ;
3. recharger le site avec un rechargement forcé (`Ctrl + F5`) en cas de cache du navigateur.

Les modifications d'interface et de logique JavaScript ne nécessitent normalement pas de modification de la base Supabase.

## Supabase

La configuration côté navigateur se trouve dans `config.js`.

Exemple :

```js
window.CHALDEA_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabasePublishableKey: 'YOUR_PUBLISHABLE_KEY',
  workspaceId: 'fgo-chaldea',
  rayshiftProxyUrl: '',
  enableRealtime: false
};
```

### Sécurité

La clé publiée dans le navigateur ne doit pas être confondue avec une clé serveur privilégiée. La protection des écritures doit être assurée côté Supabase avec les règles d'accès de la base.

**Ne jamais publier une `service_role key` ou une autre clé secrète dans `config.js`.**

## Limites actuelles

Le projet dépend de plusieurs sources externes pour certaines images et données enrichies. Une modification de leurs URLs, de leur politique CORS, de leur API ou de leur disponibilité peut empêcher certaines ressources de se charger.

Les données personnelles des joueurs ne sont pas déduites automatiquement : elles doivent être renseignées ou importées à partir des données existantes.

La récupération automatique et complète des Support Lists de services tiers peut nécessiter une couche serveur/proxy et n'est donc pas garantie directement depuis GitHub Pages.

## Pourquoi ce projet existe ?

L'objectif est de conserver la simplicité d'un tableau de suivi tout en obtenant une lecture beaucoup plus visuelle :

- voir rapidement qui est possédé ;
- repérer les Servants développés ou incomplets ;
- comparer plusieurs comptes ;
- visualiser les Skills, NP, Bond et niveaux ;
- calculer les besoins en XP ;
- consulter les informations d'un Servant sans retourner dans un tableur.

Le projet a donc été conçu comme un **dashboard personnel FGO**, et non comme un remplacement d'un outil de jeu officiel.

---

## Crédits

- **Projet / développement de l'interface** : JulienH77
- **Données de Servants et ressources externes** : sources FGO communautaires et données de jeu référencées dans l'application
- **Hébergement** : GitHub Pages
- **Persistance des données** : Supabase

## Licence

À définir selon l'usage souhaité du dépôt.
