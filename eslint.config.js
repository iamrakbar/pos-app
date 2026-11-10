const expoConfig = require("eslint-config-expo/flat");
const globals = require("globals");
const panelwind = require("panelwind").default;

module.exports = [
  ...expoConfig,
  ...panelwind.configs.recommended,
  { rules: { "panelwind/no-restyle": "off" } },
  {
    ignores: [
      "dist/**",
      ".expo/**",
      ".agents/**",
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
              message: "HeroUI has been removed. Use direct panelui-native exports.",
            },
            {
              name: "heroui-native-pro",
              message: "HeroUI Pro has been removed. Use direct panelui-native exports.",
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
