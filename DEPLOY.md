# Production Deployment Checklist — Closed Testing

## 1. Deploy Cloud Function

```bash
firebase deploy --only functions
```

---

## 2. Build the Release AAB

```powershell
.\scripts\android-clean-rebuild.ps1 -AppEnv production
```

Then set keystore credentials and build:

```powershell
$env:KEYSTORE_PASSWORD = "your-keystore-password"
$env:KEY_ALIAS         = "uran-key"
$env:KEY_PASSWORD      = "your-key-password"
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 3. Verify Firebase for `com.uran`

- Firebase Console → Authentication → Sign-in method → Google
  - Confirm `com.uran` SHA-1 `b00c249fe7ad1ed864602e3b46994165b0513de8` is listed
- Firebase Console → Realtime Database → Rules — confirm rules are published

---

## 4. Upload to Google Play Console

- Go to https://play.google.com/console
- Create the app if first time — package name: `com.uran`
- Testing → Closed testing → Create new track
- Upload `app-release.aab`
- Fill in release notes
- Add tester email addresses or create a tester group
- Roll out to the track

---

## 5. Add Play Store SHA-1 to Firebase (first upload only)

Google Play re-signs the AAB with its own key. After the first upload:

- Play Console → Setup → App integrity → App signing
- Copy the **SHA-1 certificate fingerprint**
- Firebase Console → Project Settings → `com.uran` Android app → Add fingerprint

> Required for Google Sign-In to work in builds distributed via Play Store.

---

## 6. Bump Version Before Next Release

- `.env` → increment `EXPO_PUBLIC_VERSION`
- `app.config.ts` → increment `versionCode` (must increase with every Play Store upload)
