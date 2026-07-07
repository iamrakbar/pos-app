const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const BUILD_VARIANTS = {
  development: {
    appName: "Soeat POS (Dev)",
    packageName: "id.soeat.pos.dev",
    scheme: "soeat-pos-dev",
    backgroundColor: "#dc2626",
  },
  preview: {
    appName: "Soeat POS (Preview)",
    packageName: "id.soeat.pos.preview",
    scheme: "soeat-pos-preview",
    backgroundColor: "#000000",
  },
  production: {
    appName: "Soeat POS",
    packageName: "id.soeat.pos",
    scheme: "soeat-pos",
    backgroundColor: "#0bb7cc",
  },
};

const EXPO_PROJECT_SLUG = "soeat-pos";
const variantName = process.env.APP_VARIANT || "development";
const resolvedVariantName = BUILD_VARIANTS[variantName] ? variantName : "development";
const variant = BUILD_VARIANTS[resolvedVariantName];
const protectedEnvKeys = new Set(Object.keys(process.env));

function loadEnvFile(fileName) {
  const filePath = resolve(__dirname, fileName);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!protectedEnvKeys.has(key)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(`.env.${resolvedVariantName}`);

module.exports = {
  expo: {
    name: variant.appName,
    slug: EXPO_PROJECT_SLUG,
    version: "0.0.1",
    orientation: "landscape",
    icon: "./assets/images/icon.png",
    scheme: variant.scheme,
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: variant.packageName,
      infoPlist: {
        NSBluetoothAlwaysUsageDescription:
          "Allow $(PRODUCT_NAME) to connect to Bluetooth receipt printers.",
        NSBluetoothPeripheralUsageDescription:
          "Allow $(PRODUCT_NAME) to connect to Bluetooth receipt printers.",
        NSLocalNetworkUsageDescription:
          "Allow $(PRODUCT_NAME) to connect to receipt printers on your local network.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: variant.backgroundColor,
      },
      permissions: [
        "android.permission.INTERNET",
        "android.permission.BLUETOOTH_SCAN",
        "android.permission.BLUETOOTH_CONNECT",
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE",
      ],
      predictiveBackGestureEnabled: false,
      package: variant.packageName,
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          width: 200,
          resizeMode: "contain",
          backgroundColor: variant.backgroundColor,
        },
      ],
      "expo-sqlite",
      "expo-secure-store",
      "expo-localization",
      [
        "expo-image-picker",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos to set product images.",
          cameraPermission: "Allow $(PRODUCT_NAME) to use your camera to take product photos.",
          microphonePermission: false,
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            enableMinifyInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            enablePngCrunchInReleaseBuilds: true,
            enableBundleCompression: true,
            usesCleartextTraffic: false,
          },
          ios: {
            privacyManifestAggregationEnabled: true,
            usePrecompiledModules: true,
          },
        },
      ],
      "expo-status-bar",
      "expo-font",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    extra: {
      buildVariant: resolvedVariantName,
      router: {},
      eas: {
        projectId: "0757ac22-4f65-452c-a376-ffdd8b4e290e",
      },
    },
    owner: "soeat",
    updates: {
      url: "https://u.expo.dev/0757ac22-4f65-452c-a376-ffdd8b4e290e",
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0,
    },
  },
};
