# Setwise

A fast gym workout log. Workouts, body stats and settings live on the phone (SQLite). Supabase handles sign-in and, for Pro users, optional cloud sync.

Monorepo scaffolded with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) (pnpm + Turborepo + Biome).

| Path | What |
| --- | --- |
| `apps/native` | Expo (SDK 57) app — Android first, iOS later |
| `apps/web` | Astro static marketing site: landing, `/privacy`, `/terms`, `/delete-account` |
| `supabase/functions/delete-account` | Edge Function that deletes the caller's auth user |
| `supabase/functions/revenuecat-webhook` | Edge Function that records Pro purchases in `public.entitlements` |
| `supabase/migrations` | Tables and row-level security for Pro sync |

## App overview

- **Auth** — Google sign-in (Apple on iOS) → Supabase `signInWithIdToken`. Setup steps are in the Supabase Auth Setup Guide doc.
- **Secret login** — on the sign-in screen tap the logo 5 times to skip login. Enabled in dev builds and when `EXPO_PUBLIC_ENABLE_SECRET_LOGIN=true`; the `production` EAS profile turns it off.
- **Onboarding** — name, gender, age, height, weight, units, split (PPL / Upper-Lower / Full Body / Bro / custom), experience, goal, days per week, reminder time and days.
- **Local data** — `apps/native/src/db/database.ts`. One row per workout day plus a key/value table; JSON backup/CSV export and import in Settings. Pro can additionally sync to Supabase.
- **Notifications** — local only (`expo-notifications`): weekly workout reminders and a "rest over" alert when the app is backgrounded.
- **Design** — "Electric Night": tokens in `apps/native/src/theme.ts` (mirrored in `apps/web/src/styles/global.css`).

## Pro, billing and cloud sync

- **Free vs Pro** — every Pro feature is listed in `apps/native/src/lib/pro.ts`. Screens are gated with `<ProScreen>` / `useProGate()`.
- **Billing** — RevenueCat (`react-native-purchases`). Set `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`, create an entitlement called `pro`, and attach the Play products (monthly, yearly, lifetime) to the default offering. Promo codes are Google Play promo codes.
- **Pro status on the server** — RevenueCat's app user id is the Supabase user id. Deploy the webhook so `public.entitlements` follows purchases:
  ```bash
  npx supabase db push                                   # runs supabase/migrations/*pro_sync.sql
  npx supabase secrets set REVENUECAT_WEBHOOK_AUTH="<long random string>"
  npx supabase functions deploy revenuecat-webhook --no-verify-jwt
  ```
  Then add the webhook in RevenueCat (URL `<project>/functions/v1/revenuecat-webhook`, Authorization header = the secret).
- **Cloud sync (Pro)** — Settings → Your data → Cloud sync. One row per workout day plus a few collections in `public.sync_records`; row-level security only allows the owner while `is_pro()` is true. Photos stay on the phone. The merge logic is `src/lib/sync-engine.ts` (`npx tsx src/lib/sync-engine.test.ts`).
- **Testing Pro without billing** — Settings → Developer → "Unlock Pro (developer)" (dev/preview builds). This unlocks screens only; cloud sync additionally needs a row in `public.entitlements` for your user.

## Develop

```bash
pnpm install
# Fill the keys in apps/native/.env — every variable is described in apps/native/.env.schema

# Android dev build on a USB-connected phone (debug, loads JS from Metro)
pnpm --filter native android

# JS-only changes after the first build
pnpm dev:native

# Marketing site
pnpm dev:web          # http://localhost:4321
pnpm --filter web build   # static output in apps/web/dist
```

Local Android builds are capped by `apps/native/plugins/with-android-build-limits.js` (4 Gradle workers, 3 GB heap) and build only `arm64-v8a`. For a gentler build on a busy machine:

```bash
cd apps/native/android
nice -n 15 ionice -c3 taskset -c 0-7 ./gradlew app:assembleDebug
```

## Release checklist

- Fill `apps/web/src/site.config.ts` (domain, operator name, contact email) and deploy `apps/web/dist`.
- Set `EXPO_PUBLIC_SITE_URL` to the real domain.
- Deploy the Edge Function: `npx supabase functions deploy delete-account`.
- Add release and Play App Signing SHA-1s as Android OAuth clients in Google Cloud.
- Build with the `production` EAS profile (secret login off).
