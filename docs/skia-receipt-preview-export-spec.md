# Skia Receipt Preview and Image Export Specification

## Status

Proposed.

This document specifies the migration of receipt previews from React Native
`Text`/`View` composition to a reusable Skia renderer, plus order-detail
preview, PNG saving, and PNG sharing.

## Objective

Create one receipt layout model that can drive:

1. The receipt preview in receipt settings.
2. A receipt preview from order details.
3. A high-resolution PNG saved to the device photo library.
4. A high-resolution PNG shared through the native share sheet.
5. ESC/POS text generation without duplicating receipt content rules.

The feature should make the digital receipt visually representative of the
configured thermal receipt while preserving the existing direct-to-printer
workflow.

## Background

The current receipt pipeline has two separate presentation implementations:

- `src/components/receipt/receipt-paper.tsx` renders the settings preview with
  React Native views and text.
- `src/services/printer/escpos.ts` independently constructs the printed receipt
  as ESC/POS bytes.

Both implementations use some shared helpers, but they separately decide which
lines appear and where spacing is added. This creates a risk that preview and
printed output drift as receipt behavior changes.

The current implementation also has no order-detail receipt preview and no
image export path.

## Product requirements

### Receipt settings

- Continue showing a live receipt preview.
- Render the preview with Skia.
- Continue supporting 58 mm and 80 mm preview selection.
- Continue reflecting:
  - Receipt layout.
  - Store logo.
  - Store name.
  - Header.
  - Footer.
  - Configured characters per line.
  - Configured logo width.
- Update without requiring the user to save or reopen the screen.

### Order details

- Add a `Preview receipt` action near the existing `Print receipt` action.
- Opening the action displays the current order as a receipt.
- The preview uses the selected printer's paper width, character count, and
  logo width.
- If no printer exists, use the default 58 mm receipt dimensions without
  blocking preview or export.
- The preview uses the current receipt layout settings.
- The preview overlay provides:
  - `Save image`.
  - `Share`.
  - `Print receipt`.
  - Close/dismiss behavior.

### Save image

- Render the receipt as a PNG.
- Request photo-library write permission only when the user selects
  `Save image`.
- Save to the device photo library.
- Use a filename derived from the order code:
  `receipt-<sanitized-order-code>-<timestamp>.png`.
- Show success, denied-permission, unavailable, and failure feedback.
- Do not leave temporary images in the document directory.

### Share

- Render or reuse the current receipt PNG.
- Open the native share sheet.
- Set the MIME type to `image/png` where supported.
- Use the order code in the share dialog title.
- Report when native sharing is unavailable.
- Remove expired cache exports opportunistically.

### Existing printing

- Keep the existing Bluetooth and network printer behavior.
- Keep the existing printer prompts and diagnostics.
- Keep ESC/POS output as text plus the separately printed raster logo.
- Do not replace direct receipt printing with a screenshot print.

## Non-goals

- Pixel-perfect simulation of every thermal printer model.
- Sending the entire Skia receipt bitmap to the thermal printer.
- Editing receipt settings from order details.
- PDF generation in the first version.
- Persisting a receipt-image history in app storage.
- Uploading receipts to a server.
- Adding customer delivery by email, SMS, or messaging APIs.
- Replacing printer calibration.

## Accuracy boundary

The Skia preview must accurately reproduce application-controlled behavior:

- Content inclusion.
- Line wrapping.
- Column alignment.
- Logo proportions.
- Blank lines.
- Section order.
- Paper-width proportions.
- Receipt layout differences.

The preview cannot guarantee identical physical output for:

- Printer firmware fonts.
- Printer-specific dot density.
- Hardware margins.
- Thermal darkness.
- Firmware handling of unsupported glyphs.
- Mechanical feed distance.

The selected printer's calibration remains the source of truth for
`charactersPerLine`.

## Architecture

The implementation should separate receipt semantics, layout, rasterization,
and platform export.

```text
Order + locale + receipt settings + printer settings
                         |
                         v
                  toReceiptData()
                         |
                         v
              buildReceiptDocument()
                         |
             +-----------+-----------+
             |                       |
             v                       v
      Skia rasterizer          ESC/POS encoder
             |
       +-----+------+
       |            |
       v            v
  Canvas preview  PNG file
                    |
               +----+----+
               |         |
               v         v
              Save      Share
```

### Design rule

`buildReceiptDocument()` owns what appears on the receipt and in what order.
Renderers own how that document is expressed for a target.

The Skia renderer must not inspect raw order API data. The ESC/POS renderer
must not rebuild receipt sections directly from raw order API data.

## Shared receipt document

### Proposed file

`src/services/receipt/receipt-document.ts`

### Input

```ts
export type BuildReceiptDocumentInput = {
  data: ReceiptPreviewData;
  settings: ReceiptSettings;
  paperWidth: PaperWidth;
  charactersPerLine?: string;
  logoWidthDots?: string;
  labels: {
    fallbackStoreName: string;
    order: string;
    date: string;
    type: string;
    table: string;
    payment: string;
    paymentStatus: string;
    note: string;
    subtotal: string;
    total: string;
  };
};
```

Translations must be resolved before document construction. The document
builder must remain independent of global locale state so it can be tested
deterministically and safely used by background export operations.

### Output

```ts
export type ReceiptTextAlign = "left" | "center" | "right";

export type ReceiptDocumentBlock =
  | {
      type: "logo";
      uri: string;
      maxWidthDots: number;
      gapAfterLines: number;
    }
  | {
      type: "text";
      text: string;
      align: ReceiptTextAlign;
      weight: "regular" | "bold";
    }
  | {
      type: "row";
      left: string;
      right: string;
      weight: "regular" | "bold";
    }
  | {
      type: "separator";
      character: "-";
    }
  | {
      type: "space";
      lines: number;
    };

export type ReceiptDocument = {
  paperWidth: PaperWidth;
  columns: number;
  layout: ReceiptSettings["layout"];
  blocks: ReceiptDocumentBlock[];
};
```

The builder should return semantic rows instead of already padded row strings.
Each renderer can then apply the same shared `formatReceiptRow()` helper at the
final target column count.

### Document construction rules

The rules must match the current receipt behavior.

#### All layouts

- Store name is centered and bold.
- Order metadata includes order code, date, and order type.
- Table is included only when present.
- Product names wrap to the configured character count.
- Each product includes quantity, base price, and extended price.
- Discounts, add-ons, and notes are included when present.
- The removed `"<items> items - <qty> qty"` summary must not return.
- Order notes are included when present.

#### Standard and customer layouts

- Include logo, store header, payment method, and payment status.
- Add one logical blank line between sections.
- Add one logical blank line between products.
- Include subtotal, discounts, fees, tax, total, and footer.

#### Compact layout

- Include the same customer-facing information.
- Omit optional section and inter-product blank lines.
- Preserve explicit spacing between logo and store name.
- Preserve footer separation.

#### Kitchen layout

- Omit logo.
- Omit store header.
- Omit payment method and payment status.
- Omit subtotal, discounts, fees, tax, total, and footer.
- Keep order identity, fulfillment information, products, add-ons, and notes.

#### Customer layout

The existing code currently treats `customer` like `standard`. The Skia work
must preserve that behavior. Any future content difference for `customer`
should be specified separately rather than introduced implicitly in this work.

### Printer-safe text

Add a shared normalizer:

```ts
export function normalizeReceiptText(value: string): string {
  return value.replaceAll("\u00a0", " ").replaceAll("\u202f", " ");
}
```

Use it before:

- Measuring text.
- Padding price rows.
- Drawing Skia text.
- Encoding ESC/POS bytes.

This preserves the existing fix for the non-breaking space emitted by
Indonesian Rupiah formatting. It prevents a row from measuring as one
character while becoming two printer bytes.

## Skia layout and rasterization

### Proposed files

- `src/components/receipt/skia-receipt.tsx`
- `src/services/receipt/receipt-skia.ts`
- `src/services/receipt/receipt-export.ts`
- `assets/fonts/receipt-mono-regular.ttf`
- `assets/fonts/receipt-mono-bold.ttf`

Use a bundled, redistribution-compatible monospaced font. Bundling the font is
required for deterministic measurements across iOS, Android, preview, and
export. Do not rely on Menlo or a platform `"monospace"` alias for Skia output.

The font's license must be added alongside the asset if its license requires
redistribution attribution.

### Logical canvas dimensions

Use print-oriented logical dimensions:

| Paper width | Canvas width | Default columns | Horizontal padding |
| ----------- | ------------ | --------------- | ------------------ |
| 58 mm       | 384 px       | 32              | 24 px per side     |
| 80 mm       | 576 px       | 46              | 32 px per side     |

The configured character count overrides the default when it is a valid integer
from 24 through 64.

The preview scales the logical canvas down to the available UI width. The PNG
uses the full logical canvas dimensions. Do not render a low-resolution preview
and upscale it for export.

### Typography

Initial target values:

| Element           | 58 mm | 80 mm |
| ----------------- | ----- | ----- |
| Body font         | 11 px | 12 px |
| Body line height  | 17 px | 18 px |
| Store name        | 12 px | 13 px |
| Store line height | 18 px | 20 px |

The implementation should derive the final body size from:

```text
available content width / configured columns / monospace glyph-width ratio
```

This ensures exactly `columns` monospaced glyph cells fit inside the content
area. The table above is a starting target, not a second independent source of
truth.

### Dynamic height

The layout pass must calculate height before creating the surface.

```ts
export type ReceiptLayout = {
  width: number;
  height: number;
  commands: ReceiptDrawCommand[];
};
```

Height includes:

- Top and bottom paper padding.
- Logo height after aspect-fit scaling.
- Logo-to-store-name gap.
- Every text baseline and line height.
- Section spaces.
- Footer spacing.

The renderer must not clip large orders. Apply a defensive maximum export
height and return a typed error if exceeded rather than allocating an
unbounded surface.

Recommended initial limit: `32_768` pixels.

### Draw commands

```ts
export type ReceiptDrawCommand =
  | {
      type: "text";
      text: string;
      x: number;
      baselineY: number;
      align: ReceiptTextAlign;
      weight: "regular" | "bold";
    }
  | {
      type: "logo";
      uri: string;
      destination: { x: number; y: number; width: number; height: number };
    };
```

Separators should be represented as monospaced text, matching the actual
printed separator. Do not draw an arbitrary vector line.

### Logo behavior

- Load the existing optimized local receipt logo.
- Use the shared paper-aware limit:
  - 200 dots for 58 mm.
  - 280 dots for 80 mm.
- Preserve aspect ratio.
- Never upscale beyond the source bitmap dimensions for export.
- Center horizontally.
- Reserve an explicit blank-line-equivalent gap before the store name.
- If loading fails, omit the logo and continue rendering the receipt.
- Surface a non-blocking warning only when the user is actively previewing or
  exporting; printing must remain independent.

### Rendering API

```ts
export type RenderReceiptImageInput = {
  document: ReceiptDocument;
  scale?: number;
};

export type RenderedReceiptImage = {
  image: SkImage;
  width: number;
  height: number;
};

export async function renderReceiptImage(
  input: RenderReceiptImageInput
): Promise<RenderedReceiptImage>;
```

`scale` defaults to `1`. A later version may use `2` for higher-resolution
exports if memory testing shows it is safe. Preview and export should initially
share the exact same `SkImage`.

### React component API

```ts
export type SkiaReceiptProps = {
  document: ReceiptDocument;
  maxPreviewWidth?: number;
  onRenderedImageChange?: (image: SkImage | null) => void;
  accessibilityLabel: string;
};
```

The component should:

- Render a loading state while fonts or the logo are resolving.
- Preserve the receipt aspect ratio.
- Use `useWindowDimensions()` or parent layout width, not
  `Dimensions.get()`.
- Use a vertical scroll container outside the canvas for long receipts.
- Expose a useful accessibility label because canvas text is not inherently
  available as individually navigable native text.
- Avoid rerasterizing on unrelated screen state changes.
- Release replaced Skia images when safe and avoid retaining multiple
  full-height snapshots.

## ESC/POS refactor

### Goal

Make `src/services/printer/escpos.ts` consume `ReceiptDocument` instead of
reconstructing the receipt independently.

### Required behavior

- Convert each document block into existing ESC/POS commands.
- Continue initializing the printer.
- Continue applying alignment and bold modes.
- Continue normalizing printer-safe text.
- Continue using calibrated columns.
- Continue appending drawer and cut commands.
- Continue printing the logo separately in
  `src/services/printer/print-service.ts`.

Because the printer library currently handles the logo outside the byte
payload, the ESC/POS document renderer should skip the `logo` block. The
print-service feed after the logo remains responsible for the physical
logo-to-store-name gap.

### Compatibility checkpoint

Before replacing the existing encoder, capture representative output from the
current `formatReceiptPayload()` and compare the human-readable line stream
with the new document-driven encoder for:

- Standard 58 mm.
- Compact 58 mm.
- Customer 80 mm.
- Kitchen 80 mm.

Hardware commands may differ in byte position only when required by the new
renderer. Visible text and whitespace should remain equivalent.

## Export service

### Dependencies

Install SDK-compatible versions through Expo:

```sh
npx expo install expo-media-library expo-sharing
```

Do not install arbitrary package versions with plain `npm install`.

### App configuration

Add the `expo-media-library` config plugin to `app.config.js`.

Provide user-facing permission strings for saving receipt images. Suggested
English source strings:

- Photos permission:
  `Allow $(PRODUCT_NAME) to save receipt images to your photo library.`
- Android granular permissions should be limited to photos when supported by
  the installed Expo SDK.

No photo permission is required merely to preview or share a cache file.

Changing native plugins requires a rebuilt development client before physical
save testing.

### Cache file creation

Use the modern `expo-file-system` `File` and `Paths` API already used in the
project.

```ts
export type ReceiptExportResult = {
  uri: string;
  filename: string;
  width: number;
  height: number;
};
```

The export service should:

1. Encode the Skia image with `ImageFormat.PNG`.
2. Write encoded bytes or base64 to `Paths.cache`.
3. Return a local file URI.
4. Reuse the current export for repeated Save/Share presses while its source
   document has not changed.
5. Overwrite safely or generate a unique timestamped filename.

Order-code sanitization:

```text
1. Trim whitespace.
2. Replace characters outside A-Z, a-z, 0-9, `_`, and `-` with `-`.
3. Collapse repeated `-`.
4. Fall back to `order` when empty.
```

### Save flow

```text
Tap Save image
  -> disable Save and Share actions
  -> ensure PNG cache file exists
  -> request media-library permission
     -> denied: show permission feedback and stop
     -> granted: saveToLibraryAsync(uri)
  -> show success toast
  -> re-enable actions
```

Use lazy permission requests. Do not ask for photo access when the preview
opens.

If the platform exposes a limited permission state that still permits saving,
treat it as sufficient.

### Share flow

```text
Tap Share
  -> disable Save and Share actions
  -> ensure PNG cache file exists
  -> check Sharing.isAvailableAsync()
     -> false: show unavailable feedback
     -> true: Sharing.shareAsync(uri, { mimeType: "image/png", ... })
  -> re-enable actions
```

Dismissing the system share sheet is not an error.

### Cleanup

- Keep exports in the cache directory, not documents.
- Delete the previous preview export when a new order/document export replaces
  it when practical.
- On export-service startup or first export, remove app-owned receipt cache
  files older than seven days.
- Only delete files matching the app-owned `receipt-*.png` naming convention.
- Cleanup failure must never block preview, save, share, or printing.

## Order-detail experience

### Entry actions

At the bottom of `src/screens/orders/detail/index.tsx`, use two actions:

1. `Preview receipt` as the primary entry into image workflows.
2. Existing `Print receipt` as the direct hardware action.

Recommended order:

```text
[ Preview receipt ]
[ Print receipt   ]
```

Both actions should remain full width. Printing retains its existing loading
and disabled behavior.

### Preview overlay

Proposed component:

`src/components/receipt/receipt-preview-overlay.tsx`

Use the existing `AdaptiveFormOverlay` so presentation remains:

- Bottom sheet on portrait phones.
- Dialog on larger layouts.

Overlay structure:

```text
Receipt preview
Order <code>
--------------------------------
Scrollable centered Skia receipt
--------------------------------
[ Save image ] [ Share ]
[ Print receipt          ]
```

Requirements:

- Canvas area has a neutral secondary background.
- Receipt remains white in light and dark themes.
- Preview is vertically scrollable.
- Footer actions remain reachable without scrolling to the end of a long
  receipt.
- Save and Share show a shared export progress state.
- Print uses the existing printer hook and prompt dialog.
- Closing the overlay during generation should not update unmounted state.

### Data assembly

Use:

- `toReceiptData(order, locale, t)`.
- `useReceiptStore().settings`.
- Selected `usePrinterStore().settings`.

Do not duplicate the sample-data path from receipt settings.

## Receipt-settings migration

Replace `ReceiptPaper` usage in
`src/screens/settings/receipt/index.tsx` with the Skia component.

The sample receipt remains created by `getSampleReceipt(t)`.

The settings preview should rebuild its document when any of these change:

- Locale.
- Receipt layout.
- Store logo.
- Store name.
- Header.
- Footer.
- Preview paper width.
- Configured character count for the active paper width.
- Configured logo width for the active paper width.

The old `ReceiptPaper` can be deleted only after:

- Settings preview uses Skia.
- Order-detail preview uses Skia.
- All layout tests pass.
- No other references remain.

## State and concurrency

### Suggested hook

`src/hooks/receipt/use-receipt-image.ts`

```ts
export type UseReceiptImageResult = {
  document: ReceiptDocument;
  renderedImage: SkImage | null;
  isRendering: boolean;
  isExporting: boolean;
  error: Error | null;
  save: () => Promise<void>;
  share: () => Promise<void>;
};
```

Rules:

- Only one render for a given document signature may run at a time.
- Only one export action may run at a time.
- Save and Share are disabled while exporting.
- Print state remains independent of export state.
- A stale render must not replace a newer render.
- A closed overlay must not receive state updates.

The document signature may be a stable serialization of document inputs. Do
not hash or serialize the generated Skia image.

## Error model

Create typed export errors:

```ts
export type ReceiptImageErrorCode =
  | "FONT_LOAD_FAILED"
  | "LOGO_LOAD_FAILED"
  | "RENDER_FAILED"
  | "RECEIPT_TOO_TALL"
  | "FILE_WRITE_FAILED"
  | "MEDIA_PERMISSION_DENIED"
  | "MEDIA_SAVE_FAILED"
  | "SHARING_UNAVAILABLE"
  | "SHARE_FAILED";
```

The logo error is recoverable. Render without a logo when possible.

All other errors should:

- Preserve the order-detail screen.
- Keep direct printing available unless the printer itself fails.
- Show localized, actionable feedback.
- Avoid exposing raw filesystem paths or internal exception messages to the
  user.

## Localization

Add matching keys to `src/locales/en.ts` and `src/locales/id.ts`.

Suggested key structure:

```text
orders.detail.previewReceipt
receiptPreview.title
receiptPreview.description
receiptPreview.accessibilityLabel
receiptPreview.rendering
receiptPreview.saveImage
receiptPreview.share
receiptPreview.saving
receiptPreview.sharing
receiptPreview.saved
receiptPreview.savedDescription
receiptPreview.permissionRequired
receiptPreview.permissionDescription
receiptPreview.openSettings
receiptPreview.sharingUnavailable
receiptPreview.renderFailed
receiptPreview.saveFailed
receiptPreview.shareFailed
receiptPreview.logoUnavailable
```

Both catalogs must be updated in the same change. Run
`npm run localization:check`.

## Accessibility

Skia text is not automatically exposed as native text elements.

Minimum requirements:

- Give the canvas an accessibility role of `image`.
- Provide a localized label containing the order code.
- Keep all actions as native accessible buttons.
- Announce Save success and failures through the existing toast system.
- Provide loading labels while rendering, saving, sharing, and printing.
- Do not encode receipt content only by color.

Optional follow-up:

- Add a hidden or collapsible native-text receipt transcript for screen-reader
  users. This should be generated from the same `ReceiptDocument`.

## Performance and memory

- Build the document with `useMemo`.
- Rasterize only when the document signature changes.
- Use a single full-resolution `SkImage` for preview and current export.
- Scale the canvas visually; do not create another bitmap for preview.
- Avoid base64 in React state.
- Write base64 or bytes directly to a cache file.
- Dispose superseded Skia resources where supported.
- Cap rendered height.
- Test a receipt with at least 100 product lines.
- Keep scrolling on the native UI thread; no animation is required.

Approximate raw RGBA memory:

```text
384 x 10,000 x 4 bytes = 15.4 MB
576 x 10,000 x 4 bytes = 23.0 MB
```

This is why export scale should start at `1` and height must be bounded.

## Security and privacy

Receipt images may contain:

- Customer names.
- Order identifiers.
- Table details.
- Purchase history.
- Payment method and status.

Requirements:

- Store temporary exports only in app cache.
- Do not upload receipt images.
- Do not log receipt text or image base64.
- Do not include payment secrets, QR payload URLs, tokens, or internal API
  metadata.
- Share only after an explicit user action.
- Save only after an explicit user action and permission grant.

## File-level implementation map

### New files

| File                                                 | Responsibility                                |
| ---------------------------------------------------- | --------------------------------------------- |
| `src/services/receipt/receipt-document.ts`           | Shared semantic receipt construction          |
| `src/services/receipt/receipt-skia.ts`               | Measurement and offscreen Skia rasterization  |
| `src/services/receipt/receipt-export.ts`             | PNG file, save, share, and cache cleanup      |
| `src/components/receipt/skia-receipt.tsx`            | Responsive canvas preview                     |
| `src/components/receipt/receipt-preview-overlay.tsx` | Order-detail preview and actions              |
| `src/hooks/receipt/use-receipt-image.ts`             | Render/export state and stale-work protection |
| `assets/fonts/receipt-mono-regular.ttf`              | Deterministic receipt font                    |
| `assets/fonts/receipt-mono-bold.ttf`                 | Deterministic bold receipt font               |
| Font license file                                    | Required font attribution/license             |

### Modified files

| File                                       | Change                                                         |
| ------------------------------------------ | -------------------------------------------------------------- |
| `src/services/printer/escpos.ts`           | Render `ReceiptDocument` into ESC/POS                          |
| `src/services/printer/print-service.ts`    | Pass the built document while retaining separate logo printing |
| `src/components/receipt/receipt-paper.tsx` | Delete after migration, or temporarily wrap Skia component     |
| `src/screens/settings/receipt/index.tsx`   | Use Skia preview                                               |
| `src/screens/orders/detail/index.tsx`      | Add preview entry and overlay                                  |
| `src/locales/en.ts`                        | Add preview/export strings                                     |
| `src/locales/id.ts`                        | Add matching Indonesian strings                                |
| `app.config.js`                            | Configure media-library permission                             |
| `package.json`                             | Add Expo media-library and sharing dependencies                |
| `bun.lock`                                 | Lock dependency versions                                       |

## Implementation sequence

### Phase 1: Shared document model

1. Create the document types.
2. Move receipt inclusion and spacing rules from `ReceiptPaper` into the
   builder.
3. Move printer-safe normalization into a shared helper.
4. Add unit coverage for all four layouts.
5. Verify the removed item/quantity summary is absent.
6. Keep existing preview and ESC/POS implementations running during this
   phase.

Exit condition:

- The document represents every visible receipt line and semantic gap without
  any renderer-specific code.

### Phase 2: Skia renderer

1. Add the bundled mono fonts and license.
2. Implement font loading.
3. Implement the deterministic measurement/layout pass.
4. Implement logo loading and aspect-fit placement.
5. Implement offscreen rendering.
6. Implement the responsive Skia canvas component.
7. Add overflow and height-limit handling.

Exit condition:

- A sample `ReceiptDocument` renders to a `SkImage` at both paper widths.

### Phase 3: Receipt-settings preview

1. Build a document from the sample receipt.
2. Replace the React Native receipt preview with Skia.
3. Verify live updates for every receipt setting.
4. Verify both preview paper sizes.
5. Compare standard, compact, customer, and kitchen output with the current
   preview.

Exit condition:

- Receipt settings no longer depend on React Native text layout for the paper
  preview.

### Phase 4: ESC/POS convergence

1. Add a document-to-ESC/POS renderer.
2. Compare its visible text output with the current encoder fixtures.
3. Switch `formatReceiptPayload()` to the shared document.
4. Preserve cut, drawer, alignment, and logo-feed behavior.
5. Run calibration and physical printer smoke tests.

Exit condition:

- Preview and printing consume the same receipt document.

### Phase 5: Order-detail preview

1. Add preview state to order details.
2. Build the order receipt data with the active locale.
3. Add the adaptive preview overlay.
4. Add Preview and Print actions.
5. Verify printer prompts still appear over/after the preview correctly.

Exit condition:

- Any loaded order can be previewed without a configured printer.

### Phase 6: Save and Share

1. Install Expo-compatible dependencies.
2. Configure media-library permissions.
3. Add PNG cache-file creation.
4. Add lazy Save permission flow.
5. Add native Share flow.
6. Add cleanup of app-owned stale receipt exports.
7. Add localized feedback.
8. Rebuild the development client for native verification.

Exit condition:

- A receipt can be saved and shared on physical iOS and Android devices.

### Phase 7: Cleanup and hardening

1. Remove obsolete `ReceiptPaper` code.
2. Remove duplicated receipt-content decisions from ESC/POS.
3. Confirm no base64 receipt data is logged or retained in UI state.
4. Test large receipts and logo failures.
5. Complete lint, type, localization, React Doctor, and physical printer
   checks.

## Test plan

### Unit tests

Document builder:

- Standard includes customer-facing sections.
- Compact removes optional gaps.
- Customer currently matches standard content rules.
- Kitchen omits customer-only sections.
- Empty optional values do not emit blank labeled rows.
- Long product names wrap.
- Long add-on names wrap or truncate according to shared row rules.
- Discount rows use a negative Rupiah amount.
- Non-breaking Rupiah spaces normalize to ASCII spaces.
- Item/quantity summary is absent.

Layout:

- Exactly the configured number of monospaced cells fit a line.
- Left, center, and right alignment remain inside content bounds.
- Price rows preserve the right-side amount.
- Logo never exceeds its paper-aware maximum.
- Height increases predictably with line count.
- Oversized documents return `RECEIPT_TOO_TALL`.

Export:

- Filenames are sanitized.
- PNG files use the cache directory.
- Repeated export reuses a valid rendered image.
- Cleanup targets only old `receipt-*.png` files.

### Integration checks

- Receipt settings changes update Skia preview.
- Changing preview paper width updates canvas width and wrapping.
- Order detail opens the correct order receipt.
- Print still works after preview is opened and closed.
- Save requests permission only on tap.
- Denied Save permission does not affect Share or Print.
- Share dismissal is not shown as an error.
- Missing logo still produces a receipt.
- Locale switching updates receipt labels.

### Physical-device matrix

| Platform                   | Preview  | Save     | Share    | Print        |
| -------------------------- | -------- | -------- | -------- | ------------ |
| iOS development client     | Required | Required | Required | Required     |
| Android development client | Required | Required | Required | Required     |
| Large-screen/tablet layout | Required | Required | Required | As available |

Printer smoke tests:

- 58 mm Bluetooth printer.
- 80 mm printer if available.
- Standard and compact receipts.
- A price row containing two Rupiah values.
- Logo-to-store-name spacing.
- Long total values near the calibrated line limit.

## Validation commands

```sh
npm run localization:check
npm run typecheck
npx eslint src
npx react-doctor@latest --verbose --scope changed
```

Run the project's formatter only on files changed for this feature. Do not
rewrite unrelated files.

## Acceptance criteria

The work is complete when:

- Receipt settings uses a Skia preview.
- Order details can open a receipt preview.
- The same receipt document drives preview and ESC/POS content.
- Both paper sizes honor configured columns.
- All four receipt layouts are represented correctly.
- Store-logo size and spacing match the configured print rules.
- The removed item/quantity summary does not appear.
- Users can save a PNG to the photo library.
- Users can share a PNG through the native share sheet.
- Save permission is requested lazily.
- Preview and Share work without photo-library permission.
- Direct printing remains available and unchanged operationally.
- English and Indonesian catalogs remain structurally synchronized.
- TypeScript, localization, ESLint, and React Doctor pass.
- Physical printer output has been compared with the preview for at least one
  58 mm calibration.

## Rollout and fallback

Implement the migration in small commits or reviewable stages following the
phases above.

Until ESC/POS convergence is validated, keep the existing encoder available in
the working branch for comparison. Do not ship a runtime feature flag unless
hardware testing reveals a printer-specific regression that cannot be resolved
before release.

If Skia rendering fails at runtime:

- Keep direct printing enabled.
- Show a localized preview/export error.
- Do not fall back to exporting a low-fidelity screenshot.
- The receipt settings screen may temporarily show an error state rather than
  silently displaying a divergent renderer.
