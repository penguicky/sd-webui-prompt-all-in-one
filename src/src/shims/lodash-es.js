/**
 * Minimal lodash-es shim — only provides `merge`, the sole function used
 * by vue3-colorpicker.  Replaces the full lodash-es package (~600 modules)
 * via a Vite resolve alias, saving significant bundle size.
 */

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Deep-merge `sources` into `target` (mutates `target`).
 * Mirrors lodash.merge behaviour for plain objects and arrays.
 */
export function merge(target, ...sources) {
  for (const source of sources) {
    if (!isObject(source)) continue;
    for (const key of Object.keys(source)) {
      const srcVal = source[key];
      const tgtVal = target[key];
      if (isObject(srcVal) && isObject(tgtVal)) {
        merge(tgtVal, srcVal);
      } else {
        target[key] = srcVal;
      }
    }
  }
  return target;
}

// Default export matches lodash-es shape (namespace with named exports)
export default { merge };

