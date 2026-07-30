import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const failures = [];
const literalAllowlist = new Set([
  // Currency input placeholder; this is a localized numeric symbol, not prose.
  "src/screens/pos/components/checkout-content.tsx:placeholder:Rp0",
]);
const translatableAttributes = new Set([
  "accessibilityHint",
  "accessibilityLabel",
  "description",
  "label",
  "message",
  "placeholder",
  "title",
]);

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function catalogKeys(relativePath, variableName) {
  const source = ts.createSourceFile(
    relativePath,
    read(relativePath),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const keys = [];

  function walkObject(object, prefix = "") {
    for (const property of object.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const name = property.name.getText(source).replace(/^["']|["']$/g, "");
      const key = prefix ? `${prefix}.${name}` : name;
      if (ts.isObjectLiteralExpression(property.initializer)) {
        walkObject(property.initializer, key);
      } else if (ts.isStringLiteralLike(property.initializer)) {
        keys.push(key);
      }
    }
  }

  source.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === variableName) {
        let initializer = declaration.initializer;
        while (
          initializer &&
          (ts.isAsExpression(initializer) ||
            ts.isSatisfiesExpression(initializer) ||
            ts.isParenthesizedExpression(initializer))
        ) {
          initializer = initializer.expression;
        }
        if (initializer && ts.isObjectLiteralExpression(initializer)) walkObject(initializer);
      }
    }
  });
  return new Set(keys);
}

const englishKeys = catalogKeys("src/locales/en.ts", "en");
const indonesianKeys = catalogKeys("src/locales/id.ts", "id");
for (const key of englishKeys) {
  if (!indonesianKeys.has(key)) failures.push(`Indonesian catalog is missing: ${key}`);
}
for (const key of indonesianKeys) {
  if (!englishKeys.has(key)) failures.push(`English catalog is missing: ${key}`);
}

function sourceFiles(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(relativePath);
    return /\.(tsx?|jsx?)$/.test(entry.name) ? [relativePath] : [];
  });
}

for (const relativePath of sourceFiles("src")) {
  const contents = read(relativePath);
  if (
    relativePath !== "src/locales/index.ts" &&
    relativePath !== "src/utils/format.ts" &&
    relativePath !== "src/components/common/string-number-field.tsx" &&
    relativePath !== "src/components/common/app-update-manager.tsx" &&
    /["'](?:en-US|id-ID)["']/.test(contents)
  ) {
    failures.push(`${relativePath}: use getLocaleTag() instead of a fixed locale`);
  }

  if (!relativePath.startsWith("src/screens/") && !relativePath.startsWith("src/components/")) {
    continue;
  }
  const source = ts.createSourceFile(
    relativePath,
    contents,
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  function inspect(node) {
    if (ts.isJsxText(node)) {
      const text = node.getText(source).replace(/\s+/g, " ").trim();
      if (/[A-Za-z]{2}/.test(text)) failures.push(`${relativePath}: JSX text: ${text}`);
    }
    if (
      ts.isJsxAttribute(node) &&
      translatableAttributes.has(node.name.getText(source)) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      /[A-Za-z]{2}/.test(node.initializer.text)
    ) {
      const entry = `${relativePath}:${node.name.getText(source)}:${node.initializer.text}`;
      if (!literalAllowlist.has(entry)) failures.push(`${entry} (move this text to the catalog)`);
    }
    ts.forEachChild(node, inspect);
  }
  inspect(source);
}

if (failures.length > 0) {
  console.error(
    `Localization check failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`
  );
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Localization check passed (${englishKeys.size} keys in each catalog).`);
}
