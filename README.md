# Chaldea Command V4

Web app GitHub Pages pour suivre les Servants FGO sur NA avec trois profils : Julien, Yanis, Attmann.

## Ce qui est nouveau
- Dashboard Overview recentré sur les métriques demandées.
- Distribution des skills 10 -> 1.
- Raretés 5★ / 4★ / Welfare sans texte inutile.
- Servants en portraits, cartes portrait + table.
- Multi-filtres cumulables classes / raretés.
- Tri ascendant / descendant.
- Cartes avec NP plafonné visuellement à 5 mais valeur brute conservée à l'intérieur.
- Fiche Servant avec arts Atlas, flèches, costumes lorsqu'ils sont fournis par Atlas, 5 cartes de commande, ATK/HP calculés sur le niveau + Fou.
- Skills et Append en cases carrées, skills au-dessus des appends.
- Mash/Shielder visible mais exclu des statistiques.
- Les classes Extra sont supprimées ; Moon Cancer est normalisé.
- Catalogue NA synchronisé avec Atlas Academy au chargement. Les IDs prévus dans Excel (Phantasmoon, Louhi, Van Gogh (Miner), Tutankhamun, Kazuradrop) ne sont pas gardés en attendant leur disponibilité NA.
- Coins affichés en estimation pour 4★/5★ quand le champ n'est pas renseigné, avec `*`. Les 1★-3★ sont laissés vides.
- Compare avec showdown, autocomplétion, moyennes S1/S2/S3 et radar.
- Support Lists : 3 listes normales + 3 événementielles par Master, Friend ID Rayshift et structure prête pour un proxy serveur.

## Cloud / droits
1. Créer un projet Supabase.
2. Créer les trois utilisateurs Auth.
3. Exécuter `supabase.sql`.
4. Insérer les trois lignes `chaldea_members` avec les UUID Auth et `can_edit=true`.
5. Renseigner `config.js` avec l'URL du projet et l'anon key.
6. Publier le dossier sur GitHub Pages.

Chaque utilisateur authentifié ne peut écrire que son propre `player_key`. Un lecteur peut lire les trois rosters sans voir de zone de modification.

## Sources
Atlas Academy API : https://api.atlasacademy.io/
Rayshift : https://rayshift.io/


Les 5 entrées prévues dans le classeur (Phantasmoon, Louhi, Van Gogh (Miner), Tutankhamun, Kazuradrop) sont exclues du catalogue tant qu'elles ne sont pas présentes dans la liste NA récupérée auprès d'Atlas Academy.
