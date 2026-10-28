const expoConfig = require("eslint-config-expo/flat");
const globals = require("globals");

module.exports = [
  ...expoConfig,
  {
    ignores: [
      "dist/**",
      ".expo/**",
      "node_modules/**",
      "vendor/**",
      "expo-env.d.ts",
      "uniwind-types.d.ts",
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "heroui-native",
              importNames: ["useThemeColor", "useToast", "HeroUINativeProvider"],
              message:
                "P0 migrated theme, toast, and root provider infrastructure. Use Uniwind useCSSVariable and direct panelui-native exports.",
            },
          ],
          patterns: [
            {
              group: ["panelui-native/*"],
              message:
                "Import stock components directly from panelui-native; do not copy or wrap library implementations.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["*.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
];
