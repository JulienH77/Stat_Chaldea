# Chaldea Command V5

## 1. GitHub Pages
Publish this folder as the root of your GitHub Pages site.

## 2. Supabase
Run `supabase.sql` once in the Supabase SQL Editor. Do **not** upload `initial-state.json`, the Excel file, or any other data file into Supabase. The website keeps the Excel snapshot locally as a fallback and imports it into `chaldea_stats` when an editor explicitly clicks the first-time import banner.

### Add Julien
After creating Julien in Supabase Authentication, copy the Auth user UUID and run the INSERT shown at the bottom of `supabase.sql`.

### Add Yanis / Attmann later
Create their Auth users, then add one row each to `chaldea_members` with `player_key` = `yanis` or `attmann`.

## 3. config.js
Put your Supabase URL and anon key here:
```js
window.CHALDEA_CONFIG={
  supabaseUrl:'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey:'YOUR_ANON_KEY'
};
```
Only the anon key belongs in the browser. Never publish a service-role key.

## 4. Persistence model
- Logged-out visitors read `chaldea_stats` from Supabase when available.
- A logged-in editor can only write the rows belonging to their own `player_key`.
- The static Excel snapshot is only a fallback / first import. It does not overwrite cloud data after synchronization.
- Supabase Realtime refreshes the public view when a stat changes.

## 5. Current limitations
Rayshift is public and shows the support list through its own site, but an embedded live mirror can be blocked by browser framing/CSP rules. The Support Lists tab therefore includes a Rayshift profile frame when permitted and a full direct link as fallback. Automatic parsing of the six decks should be moved to a server-side proxy if Rayshift exposes a supported endpoint for it.


### Supabase
`config.js` contains your Supabase project URL. Paste the **anon public key from Supabase** into `supabaseAnonKey` (the key is intentionally left blank in this packaged build). Run only `supabase.sql` in the Supabase SQL Editor. Do not upload `initial-state.json` or the Excel file to Supabase.
