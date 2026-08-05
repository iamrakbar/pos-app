"use strict";

/**
 * Mirrors expo-blur's `BlurTint` union. Kept in sync manually because
 * expo-blur is an optional peer dependency and cannot be imported statically.
 */

let ExpoBlurPackage;
try {
  ExpoBlurPackage = require('expo-blur');
} catch (_error) {
  /* expo-blur is an optional peer dependency */
}
export default ExpoBlurPackage;