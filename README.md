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
npm install
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

Env loading order for local scripts:

1. `.env`
2. `.env.<variant>`
3. Existing shell or EAS env values

This means explicit shell values and EAS profile values stay authoritative.

## Run Locally

Start the dev client bundler:

```sh
npm run start:dev
npm run start:preview
npm run start:prod
```

Run native builds locally:

```sh
npm run android:dev
npm run android:preview
npm run android:prod

npm run ios:dev
npm run ios:preview
npm run ios:prod
```

Inspect resolved Expo config:

```sh
npm run config:dev
npm run config:preview
npm run config:prod
```

## EAS Builds

Build Android:

```sh
npm run build:android:dev
npm run build:android:preview
npm run build:android:prod
```

Build iOS:

```sh
npm run build:ios:dev
npm run build:ios:preview
npm run build:ios:prod
```

Build both platforms:

```sh
npm run build:dev
npm run build:preview
npm run build:prod
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
npm run typecheck
```

Run linting:

```sh
npm run lint
```

Check formatting:

```sh
npm run format:check
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
