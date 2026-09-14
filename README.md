# Chaldea Command V3

Interface web FGO pour trois Masters : Julien, Yanis et Attmann.

## Fonctionnalités
- Overview : 5★, 4★, Welfares, moyenne des 3 skills, distribution 1→10, niveaux 100/120, Bond 10+.
- Servants : cards portrait ou table, recherche, classes, raretés, tri Bond / NP / niveau / rareté.
- Manquants : bannière "NON POSSÉDÉ" + rendu atténué.
- Compare : statistiques de comptes + duel Servant par Servant.
- Données NA : Atlas Academy NA est utilisé pour enrichir les visuels et métadonnées en ligne.
- Nouveaux Servants : la liste de référence locale peut être resynchronisée plus tard ; le site est prêt à utiliser le catalogue NA Atlas comme source canonique.
- Cloud : Supabase Auth + RLS pour que chaque compte n'écrive que son propre roster.

## GitHub Pages
Le dépôt doit servir la racine de ce dossier.

## Cloud
1. Créer un projet Supabase.
2. Activer Email/Password.
3. Créer les trois utilisateurs.
4. Exécuter `supabase.sql`.
5. Ajouter les trois lignes de `chaldea_members` avec les UUID des comptes.
6. Mettre URL + anon key dans `config.js`.
7. Les utilisateurs peuvent alors se connecter via « Connexion / cloud ».

Ne jamais publier une Supabase service_role key dans GitHub.
