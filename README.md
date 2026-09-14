# Chaldea Command · V7

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

Rayshift exposes public NA friend profiles, but a browser-only GitHub Pages app cannot reliably read the HTML cross-origin. This V7 therefore does not pretend an iframe is a data API.

`supabase/functions/rayshift-proxy/index.ts` is the server-side proxy skeleton. Deploy it as a Supabase Edge Function, then set `rayshiftProxyUrl` in `config.js`. The client can then fetch the public Rayshift HTML through your own endpoint and render the six support decks in its own UI.

## QA

`app.js` is checked with `node --check` before packaging.
