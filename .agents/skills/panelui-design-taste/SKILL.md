---
name: panelui-design-taste
description: "Design taste for PanelUI React Native and Expo interfaces. Use when creating PanelUI screens, reviewing visual quality, or improving spacing, hierarchy, forms, actions, navigation, and accessibility. Complements the PanelUI API skill."
metadata:
  version: "1.0.0"
---

# PanelUI Design Taste

Design guidance for `panelui-native` and CLI-copied PanelUI components. Preserve restrained visual hierarchy and balanced spacing while respecting native interaction, compound anatomy, and all six themes. These are design preferences; product requirements, accessibility, and verified component contracts take precedence.

## Read Before Designing

Use the companion [PanelUI skill](../panelui/SKILL.md) for setup, composition, theming, and component APIs. This skill adds visual judgment, not a second API catalog.

When PanelUI MCP is available:

1. Call `panelui_get_project_info` first to determine package versus copied-source imports and existing setup.
2. Call `panelui_search_components` before building a custom standard pattern. Use `panelui_list_components` to explore the catalog.
3. Call `panelui_get_component_docs` for each component you intend to use. Use `panelui_view_component` when anatomy or behavior needs source verification.
4. Check installed types/source before using version-sensitive APIs. The live registry and companion skill may describe a newer release than the app.

If MCP is unavailable, inspect `package.json`, `panelui.json` if present, and the companion skill's component references. Consult installed source for version-sensitive behavior. Never invent props or silently upgrade dependencies to match documentation. `panelui_get_add_command` suggests source-copy commands; visual review alone does not require copying or installing components.

## Design Philosophy

Prefer semantic variants, purposeful whitespace, clear typography, and one dominant action. Let components own their visual treatment and use `className` chiefly for layout. Prefer PanelUI components for standard patterns. Remove decoration that carries no information. Prevent accidental layout shifts without putting essential content into overlapping layers.

## General

- Keep default sizes unless context, readability, or touch targets require a change.
- Prefer one effective representation of a fact. A second representation should add precision or accessibility, such as a chart with a readable value.
- Avoid overriding component colors, type, and radii with arbitrary utilities. Use verified variants and parts.
- Keep trust signals and supplementary footers brief; remove redundant badges, logos, and companion icons.
- Remove unnecessary `View` wrappers while retaining those needed for layout, accessibility, or measurement.

## Spacing & Layout

- Use a consistent 4/8dp rhythm. Start with `gap-4` or `gap-6` between groups and moderate padding; adjust to content rather than applying `p-8` everywhere.
- Let one container own spacing in each direction. Card slots own padding; do not add redundant root padding.
- Give headings breathing room below safe areas and navigation headers. Avoid a second inset where navigation already handles it.
- Use `gap-*`, never `space-x-*` or `space-y-*`. Explicitly align flex children where stretching would distort compact controls.
- Use bounded `ScrollView` layouts for short scrollable content and virtualized lists for large collections. CSS `overflow-auto` does not implement native scrolling. Scroll indicators should wrap genuinely scrollable content.
- Align metric values and supporting text to the start; place a supporting chart at the end when useful. Check `Kpi` and chart components before inventing widgets.
- Size short Dialogs to content, with constrained widths on tablets. Use documented BottomSheet/Dialog anatomy rather than web modal assumptions.
- Scroll compact chips or thumbnails horizontally only when they cannot fit comfortably.
- Align sibling cards consistently without fixed heights that truncate translations or scaled text. Featured content can occupy its own full-width row.
- Constrain reading width on large screens. Remove excessive fixed heights and empty space.
- Size badges and chips to content. Absolute positioning suits small trigger badges, provided they neither hide labels nor intercept unintended presses.
- Reserve space for floating controls, safe areas, and keyboards. Keep meaningful charts in normal flow; only decorative highlights belong outside it.

## Typography

- Prefer verified `Typography` presets and Card title/description parts to repeated custom size/weight combinations.
- Use concise headings with natural capitalization consistent with the product language; avoid decorative ALL CAPS.
- Optically align large numbers with units. Center punctuation against the number, not its supporting label; avoid line heights that clip native glyphs.
- Use tabular figures for changing or aligned metrics where supported by the font and styling integration, such as React Native `fontVariant: ['tabular-nums']`.
- Keep supplementary descriptions brief, usually two or three lines. Do not truncate errors, instructions, or decision-critical information.
- Fit labels into bounded indicators without shrinking below readable sizes. Preserve font scaling and permit wrapping.

## Color & Theming

- Use semantic tokens such as `bg-background`, `bg-card`, `text-card-foreground`, `text-muted-foreground`, and `border-border`. Verify surface/status tokens against PanelUI's theme.
- Prefer neutral metric surfaces and meaningful accents. Chip uses documented variants such as `success`, `warning`, `info`, and `destructive`, not invented `color` or `soft` props.
- Pair surfaces with their foreground tokens. Use muted semantics for secondary copy rather than blanket opacity that weakens contrast.
- Use success for positive outcomes, destructive for errors/destructive actions, and warning for genuine caution. Never communicate state through color alone.
- Protect text over media with theme-aware scrims or documented surface treatments. Platform-dependent blur must not be required for legibility.
- No hardcoded colors or `dark:` layout fixes. Tokens cover Panel, Moon, and Grass in light/dark; their radius scales also differ.
- Resolve runtime icon/chart/style colors through the project's verified `useCSSVariable` integration. Prefer `chart-1` through `chart-5` for chart series when appropriate.
- Register named themes before switching them. Restart Metro after theme registration or adding arbitrary utilities. A polish task does not require enabling new themes.

## Cards & Surfaces

- Compose `Card.Header`, `Card.Title`, `Card.Description`, `Card.Content`, and `Card.Footer`. Verify which part accepts a variant; do not assume the root does.
- Avoid stacked shadows and redundant nested card surfaces. Meaningful nested grouping may be appropriate; try spacing or a subdued region before another elevated container.
- Match media scale to the task: larger images for detail features, compact thumbnails or Carousel for browsing.
- Card root has no default padding. For full-bleed media, adjust relevant slots instead of reflexively adding `p-0`. Native images use `resizeMode="cover"` when appropriate.
- Derive inner corners from theme radius and inset rather than hardcoding one radius formula across themes. Clip deliberately, without cutting off shadows, focus treatment, or content.
- Use borders for structural definition. Avoid adding both a card border and image outline by habit.
- Keep progress indicators in content flow, not decorative strips along card edges.

## Forms & Inputs

- Keep persistent visible labels for ordinary fields. Placeholders provide hints or examples; they do not replace labels.
- Use documented label/description/error slots when sufficient. Use `Field` and its parts for more complex compositions; avoid duplicate labels and error announcements.
- Input documents `outline` and `filled` variants. Choose one that contrasts with its container.
- Constrain compact numeric/mode controls without truncating values or translations. Full-width text fields remain appropriate on phones.
- Use verified `startContent`/`endContent` adornments, distinguishing decorative icons from actionable controls.
- Place switches at the trailing end of clearly labeled rows, following the project's verified PanelUI/native control pattern.
- Choose appropriate keyboard configuration. Keep focused fields, validation, and submit controls reachable above the keyboard; verify Android behavior before relying on optional keyboard integrations.

## Buttons & Actions

- Use verified Button variants: `primary`, `secondary`, `outline`, `ghost`, `destructive`, and `social`.
- Give each screen one dominant primary action. Use secondary/outline/ghost for subordinate actions and documented destructive semantics for destructive behavior.
- Prefer short text labels. Add icons only when they clarify actions. Icon-only secondary actions fit familiar, discoverable controls; otherwise retain text.
- Give icon-only Buttons `size="icon"` and an explicit `accessibilityLabel`. Ensure at least a 48dp Android touch target through supported sizing or nonoverlapping hit slop; do not assume the default square suffices.
- Provide an understandable cancel/dismiss/back path in modal workflows. Avoid redundant escape buttons in every card.
- Use documented ButtonGroup/Tabs patterns for a few parallel modes and Select/Combobox/Menu for larger sets after checking APIs.
- Maintain dimensions across variant/selection changes. Use verified `loading` and `disabled` behavior; explain blocked actions near controls when needed.
- Place major CTAs below descriptive content. Compact contextual toolbars can keep actions inline.
- Follow documented overlay trigger composition; do not add Button wrappers that create nested press targets.
- Platform-native rendering and portable styling have different contracts. Native controls ignore many styling props. Check optional dependencies/platform behavior before enabling `native` or `glass`; labelled native Buttons require string children rather than hosted Text elements.

## Icons & Decoration

- Use the existing icon library with consistent sizes/strokes. Avoid decorative emojis in headings and labels.
- Keep routine icons muted and use semantic emphasis for meaningful status. Allow Button icon slots to inherit variant foreground where supported.
- Use separators for meaningful boundaries; let parents own spacing. Verify orientation support for toolbars.
- Remove badges, gradients, dividers, and illustrations that repeat content or compete with the primary action.

## Navigation & Structure

- Use Expo Router for screen navigation. PanelUI Tabs serve in-screen parallel content unless verified integration explicitly supports routing.
- Prefer phone-appropriate stacks, tabs, sheets, and menus. Preserve established navigation rather than importing desktop sidebar conventions.
- Order content from overview to detail and controls by decision priority. Collapse optional details with Accordion/Collapsible when useful; keep primary actions visible.
- Keep applied filters visible near controls instead of replacing controls with selected state.
- Floating contextual toolbars are optional. Respect safe areas/keyboards and reserve content space; stable inline toolbars are also valid.
- Group navigation with spacing and concise labels. Avoid repeated identity/branding. Make avatars interactive only when they open real account actions.
- Use documented selected states rather than elevated backgrounds that fight built-in state styling.
- Ensure exactly one `PanelUIProvider` hosts overlays. Keep compound parts under their roots. Use `open`/`onOpenChange` or documented uncontrolled state; do not unmount overlays before exit animations complete.

## Accessibility & Motion

- Use React Native labels, hints, roles, and states rather than copying DOM ARIA/cursor rules. Preserve built-in component semantics.
- Icon-only controls require spoken names. A documented Tooltip can aid discovery but never replaces the label or becomes mandatory for every touch action.
- Preserve readable contrast, persistent field labels, logical focus order, and non-color state cues. Check TalkBack for overlays, errors, selection, and loading.
- Support font scaling, narrow screens, long translations, and RTL. Prefer start/end semantics over fixed left/right assumptions.
- Informational rows should not look pressable. Give actual controls immediate, restrained press feedback; hover-only behavior does not serve touch users.
- Use established Reanimated patterns for custom motion, not core Animated. Respect reduced motion and keep state changes understandable without animation or haptics.

## Review and Delivery

Review hierarchy, redundancy, slot padding, token contrast, clipping, touch targets, keyboard reachability, and navigation/overlay behavior. Check supported theme modes and the relevant native target. In Jelajah, Android is the current verification target; iOS is deferred. Follow repository validation and execution-plan requirements. Report actual checks and limitations; documentation or static mockups do not prove device acceptance.
