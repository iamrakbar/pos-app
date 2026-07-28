# Soeat POS

Soeat POS is an Expo React Native point-of-sale app for Android and iOS. It uses Expo Router, HeroUI Native, Uniwind, local SQLite storage, and thermal printer integration for receipt printing.

## Stack

- Expo SDK 57 with development client builds
- React 19 and React Native 0.86
- Expo Router for file-based navigation
- HeroUI Native and HeroUI Native Pro for app UI
- Uniwind and Tailwind CSS for styling
- Drizzle ORM with Expo SQLite
- Zustand for local state
- `@haroldtran/react-native-thermal-printer` for BLE, USB, and network printers
- EAS Build and Expo Updates for distribution

## Setup

Install dependencies:

```sh
bun install
```

Create local env files from the examples:

```sh
cp .env.development.example .env.development
cp .env.preview.example .env.preview
cp .env.production.example .env.production
```

Local `.env.*` files are ignored by git. Keep real API hosts, credentials, and device-specific values in those files or in EAS environment variables.

Cloud builds read `EXPO_PUBLIC_API_BASE_URL` from the EAS environment selected
by each build profile. Configure it once for `development`, `preview`, and
`production`, then verify the values:

```sh
eas env:set --name EXPO_PUBLIC_API_BASE_URL --environment development --visibility plaintext
eas env:set --name EXPO_PUBLIC_API_BASE_URL --environment preview --visibility plaintext
eas env:set --name EXPO_PUBLIC_API_BASE_URL --environment production --visibility plaintext

eas env:list --environment development
eas env:list --environment preview
eas env:list --environment production
```

## Environment Variants

The app supports three build variants:

| Variant     | App name            | Android package / iOS bundle ID | Scheme              |
| ----------- | ------------------- | ------------------------------- | ------------------- |
| development | Soeat POS (Dev)     | `id.soeat.pos.dev`              | `soeat-pos-dev`     |
| preview     | Soeat POS (Preview) | `id.soeat.pos.preview`          | `soeat-pos-preview` |
| production  | Soeat POS           | `id.soeat.pos`                  | `soeat-pos`         |

Variant config is resolved in `app.config.js` from `APP_VARIANT`. When it is
unset, the safe default is production; unknown values fail immediately.
All variants use the same Expo/EAS project slug, `soeat-pos`, because the configured `extra.eas.projectId` belongs to that Expo project. The installed app is separated by native package ID, display name, scheme, channel, and env values.

Env loading order for local scripts:

1. `.env`
2. `.env.<variant>`
3. Existing shell or EAS env values

This means explicit shell values and EAS profile values stay authoritative.

## Run Locally

Start the dev client bundler:

```sh
bun run start
bun run start:preview
bun run start:production
```

Run native builds locally:

```sh
bun run android
bun run android:preview
bun run android:production

bun run ios
bun run ios:preview
bun run ios:production
```

Inspect resolved Expo config:

```sh
bun run config:dev
bun run config:preview
bun run config:production
```

## EAS Builds

Each build script targets both platforms by default:

```sh
bun run build:dev
bun run build:preview
bun run build:production
```

Pass a platform to build only Android or iOS:

```sh
bun run build:preview -- --platform android
bun run build:production -- --platform ios
```

Development and preview Android builds produce APKs for internal testing. Production Android builds produce an app bundle.

When switching variants for a local native build, run the matching
`prebuild:<variant>` script first. Expo's generated `android` and `ios`
directories contain the previously generated variant until they are regenerated.

## Printer Support

The printer settings screen supports:

- BLE, USB, and network printer modes
- Permission request and recovery flows through HeroUI Native dialogs
- Bluetooth settings deep link on Android through `expo-intent-launcher`
- Saved printer selection and paper width
- Test printing from settings
- Receipt printing from order detail after printer setup is complete

Bluetooth cannot be force-enabled directly by the app on modern Android. The app can request permissions and send the user to Bluetooth settings.

Required native permissions and usage strings are configured in `app.config.js`.

## Validation

Run type checking:

```sh
bun run typecheck
```

Run linting:

```sh
bun run lint
```

Check formatting:

```sh
bun run format:check
```

## Project Layout

- `src/app`: Expo Router routes and layouts
- `src/screens`: screen-level UI and workflows
- `src/stores`: Zustand stores
- `src/db`: SQLite and Drizzle setup
- `src/types`: local type declarations
- `app.config.js`: dynamic Expo app config
- `eas.json`: EAS build profiles
