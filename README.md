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

## Environment Variants

The app supports three build variants:

| Variant     | App name            | Android package / iOS bundle ID | Scheme              |
| ----------- | ------------------- | ------------------------------- | ------------------- |
| development | Soeat POS (Dev)     | `id.soeat.pos.dev`              | `soeat-pos-dev`     |
| preview     | Soeat POS (Preview) | `id.soeat.pos.preview`          | `soeat-pos-preview` |
| production  | Soeat POS           | `id.soeat.pos`                  | `soeat-pos`         |

Variant config is resolved in `app.config.js` from `APP_VARIANT`.
All variants use the same Expo/EAS project slug, `soeat-pos`, because the configured `extra.eas.projectId` belongs to that Expo project. The installed app is separated by native package ID, display name, scheme, channel, and env values.

Env loading order for local scripts:

1. `.env`
2. `.env.<variant>`
3. Existing shell or EAS env values

This means explicit shell values and EAS profile values stay authoritative.

## Run Locally

Start the dev client bundler:

```sh
bun run start:dev
bun run start:preview
bun run start:prod
```

Run native builds locally:

```sh
bun run android:dev
bun run android:preview
bun run android:prod

bun run ios:dev
bun run ios:preview
bun run ios:prod
```

Inspect resolved Expo config:

```sh
bun run config:dev
bun run config:preview
bun run config:prod
```

## EAS Builds

Build Android:

```sh
bun run build:android:dev
bun run build:android:preview
bun run build:android:prod
```

Build iOS:

```sh
bun run build:ios:dev
bun run build:ios:preview
bun run build:ios:prod
```

Build both platforms:

```sh
bun run build:dev
bun run build:preview
bun run build:prod
```

Development and preview Android builds produce APKs for internal testing. Production Android builds produce an app bundle.

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
- `scripts/with-env.js`: variant-aware env loader for local commands
- `app.config.js`: dynamic Expo app config
- `eas.json`: EAS build profiles
