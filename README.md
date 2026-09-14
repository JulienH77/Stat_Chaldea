# Chaldea Command — FGO roster dashboard

Une interface web statique pour transformer le classeur `stat_chaldea.xlsx` en dashboard FGO.

## Ce qui est inclus

- données initiales importées des onglets `FGOjulien`, `FGOyanis`, `FGOattmann` et `excelATLAS` ;
- vue Overview avec KPIs, répartition par classe, skills, priorités et highlights ;
- vue Servants avec recherche, filtres et modes cards/table ;
- fiche détaillée d'un Servant avec édition rapide ;
- vue Compare entre Julien, Yanis et Attmann ;
- vue Upgrade pour faire ressortir les Servants incomplets ;
- images enrichies à la volée via Atlas Academy lorsque l'API répond ;
- sauvegarde locale automatique dans `localStorage` ;
- préparation d'un mode collaboratif Supabase via `supabase.sql`.

## GitHub Pages

1. Créez un nouveau dépôt GitHub.
2. Copiez tout le dossier dans le dépôt.
3. Activez GitHub Pages sur la branche principale / dossier racine.
4. Ouvrez l'URL Pages.

Aucun build n'est nécessaire.

## Mode collaboratif

GitHub Pages ne sait pas écrire dans un fichier du dépôt depuis le navigateur de manière sûre. Le projet prévoit donc Supabase pour stocker les stats partagées.

1. Créez un projet Supabase.
2. Ouvrez SQL Editor et exécutez `supabase.sql`.
3. Copiez l'URL du projet et l'anon key dans `config.js`.
4. Pour un groupe privé, conservez un accès authentifié ou remplacez les policies permissives fournies ici par des policies basées sur `auth.uid()`.

Le mode local reste fonctionnel sans Supabase.

## Mise à jour des Servants

L'application utilise votre base initiale pour le roster. À l'ouverture d'une fiche, elle interroge Atlas Academy pour récupérer des détails/visuels plus récents. Atlas Academy publie également des exports complets de données FGO ; cela permet d'automatiser plus tard la mise à jour de la base canonique.

## Rayshift

Rayshift propose une recherche/consultation de support publique et une API de lookup, mais le lookup API demande une clé API. Il est donc préférable de l'utiliser comme source externe optionnelle, pas d'exposer une clé Rayshift dans GitHub Pages.
