# URAN — Atmospheric Shield

Expo SDK 54 · RN 0.81.5 · TypeScript · managed Expo (never edit `/android` or `/ios`).

## What: Technology Stack

- **Expo SDK 54** with React Native 0.81.5 - Managed React Native development
- **TypeScript** - Strict type safety throughout
- **Expo Router 6** - File-based routing (like Next.js)
- **TailwindCSS** via Uniwind/Nativewind - Utility-first styling for React Native
- **Zustand** - Lightweight global state management
- **React Query** - Server state and data fetching
- **TanStack Form + Zod** - Type-safe form handling and validation
- **MMKV** - Encrypted local storage
- **Jest + React Testing Library** - Unit testing

## Commands

```bash
pnpm start              # dev server
pnpm type-check         # tsc --noemit
pnpm lint && pnpm test  # ESLint + Jest (40 tests must stay green)
pnpm check-all          # lint + type-check + translations + test
pnpm build:production:ios   # EAS build
```

**Environment-Specific:**
```bash
pnpm start:preview              # Preview environment
pnpm ios:production             # Production iOS
pnpm build:production:ios       # EAS production build
```

## How: Key Patterns

- **Create features**: New folder in `src/features/[your-feature]/` with screens, components, API hooks
- **Add routes**: Create files in `src/app/` (file-based routing)
- **Forms**: Use TanStack Form + Zod (see `src/features/auth/components/login-form.tsx`)
- **Data fetching**: Use React Query (see `src/features/feed/api.ts`)
- **Global state**: Use Zustand (see `src/features/auth/use-auth-store.tsx`)
- **Styling**: NativeWind/Tailwind classes (see `src/components/ui/button.tsx`)
- **Storage**: Use MMKV via `src/lib/storage.tsx` for sensitive data
- **Imports**: Always use `@/` prefix, never relative imports

## Directory map

```
src/
├── app/              # Expo Router routes; (app)/ is the authenticated tab group
├── features/auth/    # login + sign-up screens, forms, use-auth-store
├── components/ui/    # Button, Input, custom-splash-screen, colors.js, use-theme-config
├── lib/
│   ├── firebase/     # index.ts (init + MMKV persistence), auth.ts (signUp/signIn/etc.)
│   ├── theme/        # index.ts → dark + light palettes + useThemeColors()
│   └── storage.tsx   # MMKV wrapper — use storage.remove(key), NOT storage.delete
assets/splash-bg.png  # Animated splash background (glassmorphic blue)
env.ts                # Zod-validated env schema — add new vars here AND in .env
```

## Architecture

- **Routing**: `(app)/_layout.tsx` redirects to `/login` when `status === 'signOut'`. After sign-in, call `router.replace('/')` explicitly — no automatic reverse redirect.
- **Auth**: Firebase JS SDK v12 (`firebase` package, not `@react-native-firebase`). `onAuthStateChanged` in `use-auth-store.hydrate()` drives Zustand `status`. Email verification is enforced — unverified users are signed out immediately; do not bypass.
- **Google Sign-In**: `expo-auth-session/providers/google` + `expo-web-browser`. Call `WebBrowser.maybeCompleteAuthSession()` at module level in each screen. Hook fires a browser OAuth flow; on success pass `authentication.idToken` + `accessToken` to `signInWithGoogle()` in `src/lib/firebase/auth.ts`. Requires `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env` (from Firebase Console → Authentication → Google → Web SDK configuration).
- **Firebase persistence**: Custom MMKV adapter in `src/lib/firebase/index.ts` (`_set/_get/_remove`). Firebase v12 removed `getReactNativePersistence` — do not import it.
- **Theme**: Atmospheric Shield design system — blue primary, not orange. `src/lib/theme/index.ts` exports `dark`, `light`, `useThemeColors()`. `useUniwind()` from `'uniwind'` returns `'dark'|'light'|'system'`; system is treated as light. Dark mode: `className={theme.dark ? 'dark' : undefined}` on root.
- **Splash**: `CustomSplashScreen` overlays the Stack until `status !== 'idle'` and the progress animation finishes.

## Rules
- ✅ **DO** use absolute imports: `@/components/ui/button`
- ✅ **DO** follow feature-based structure: `src/features/[name]/`
- ✅ **DO** use TanStack Form for forms (not react-hook-form)
- ✅ **DO** use MMKV storage for sensitive data (not AsyncStorage)
- ✅ **DO** use EAS Build for production: `pnpm build:production:ios`
- ✅ **DO** prefix env vars with `EXPO_PUBLIC_*` for app access
- ❌ **DO NOT** modify `android/` or `ios/` directly (use Expo config plugins)
- Always use `@/` absolute imports — never relative paths.
- Use TanStack Form + Zod for every form — not react-hook-form.
- Apply theme colors: `style={[s.layout, { color: c.onSurface }]}` — static layout in StyleSheet, colors as inline overrides from `useThemeColors()`.
- SVG icons are inline `react-native-svg` components with a `color` prop.
- Firebase config is in `.env` as `EXPO_PUBLIC_FIREBASE_*`. Add to EAS as **Plaintext** env vars.
- Call `signOut()` from `use-auth-store` — it calls `firebaseSignOut` + updates Zustand. Never call Firebase directly from screens.
- `EXPO_PUBLIC_*` vars are accessible in `src/`; non-prefixed vars only work in `app.config.ts`.
- No AsyncStorage — MMKV only (`src/lib/storage.tsx`).
