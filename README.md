# Chaldea Command · V17

GitHub Pages dashboard for a small FGO NA roster shared by Julien, Yanis and Attmann.

## Data architecture

- `data/initial-state.json` is the local seed/snapshot only.
- Supabase `chaldea_stats` is the shared source of truth once cloud is configured.
- Atlas Academy NA is used for the live Servant catalogue, stats and artworks. The NA API is queried separately from JP.
- `data/welfare-ids.json` stores the explicit Welfare list because Welfare status is not safe to infer only from rarity.

## Supabase

Run **only** `supabase.sql` in the SQL editor. Do not upload `initial-state.json` to Supabase.

The authenticated player can edit only their own `player_key`. Public/other users can read the roster.

Put the project URL and browser-safe public key in `config.js`.

## First initialization

1. Create the three Supabase Auth users.
2. Link them to `julien`, `yanis`, and `attmann` in `chaldea_members`.
3. Log in on the site.
4. The editor can import the initial snapshot into Supabase.

## Rayshift support synchronization

Rayshift exposes public NA friend profiles, but a browser-only GitHub Pages app cannot reliably read the HTML cross-origin. This V8 therefore does not pretend an iframe is a data API.

`supabase/functions/rayshift-proxy/index.ts` is the server-side proxy skeleton. Deploy it as a Supabase Edge Function, then set `rayshiftProxyUrl` in `config.js`. The client can then fetch the public Rayshift HTML through your own endpoint and render the six support decks in its own UI.

## QA

`app.js` is checked with `node --check` before packaging.


## V13 data reset
Yanis and Attmann initial snapshots are rebuilt from the supplied FGOyanis/FGOattmann sheets from scratch. Only explicit NP/Skill entries are imported; old incorrect level/bond/grail/append/coin values for these two players are not retained.


## V14 friend-data reset
Yanis and Attmann are rebuilt strictly from columns ID, servant, NP, Skill 1, Skill 2, Skill 3 in their current Excel exports. `supabase-reset-friends.sql` clears previous bad cloud rows and inserts the fresh values.


## V17 updates
- Overview skill scope toggle: ALL or GOLD (4★/5★ + Welfare), and the selected scope updates skill averages.
- Overview collection ring no longer repeats the percentage inside the ring.
- NA roster sync now prefers Atlas Academy's static `export/NA/basic_servant.json` so low-rarity/support Servants are not lost when their NP does not deal damage.
- Compare keeps the selected Showdown Servant across refreshes, removes possession/coins rows, adds skills + append skill blocks, and uses Julien red, Yanis blue, Attmann green in the radar.
- Added a one-click "Enregistrer toutes mes données" action in the authenticated editor account dialog for Servant stats, XP inventory and support Friend ID.
- No database schema changes are introduced in V17; do not rerun SQL just for this release.
