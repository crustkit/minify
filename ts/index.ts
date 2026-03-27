import { minifyJs as _minifyJs, minifyCss as _minifyCss } from './binding'
import { detectLanguage } from './detect'
import { Prettify } from './types'

// ---------------------------------------------------------------------------
// JS Options & Result
// ---------------------------------------------------------------------------

export type JsOptions = Prettify<{
  /** Shorten variable names. @default true */
  mangle?: boolean
  /** Dead code elimination & constant folding. @default true */
  compress?: boolean
  /** Generate a source map. @default false */
  sourceMap?: boolean
  /** Filename — used for source maps and error messages. */
  filename?: string
  /** Treat as ES module. @default auto-detected from filename extension (.mjs = module) */
  module?: boolean
}>

// ---------------------------------------------------------------------------
// CSS Options & Result
// ---------------------------------------------------------------------------

export type CssOptions = Prettify<{
  /** Generate a source map. @default false */
  sourceMap?: boolean
  /** Filename — used for source maps and error messages. */
  filename?: string
}>

// ---------------------------------------------------------------------------
// Shared result types with source map narrowing
// ---------------------------------------------------------------------------

export type MinifyResult = Prettify<{
  /** The minified code. */
  code: string
  /** Source map JSON string. Only present when `sourceMap: true`. */
  map: string | null
}>

export type MinifyResultWithMap = Prettify<{
  code: string
  /** Source map JSON string. Guaranteed present. */
  map: string
}>

export type MinifyResultWithoutMap = Prettify<{
  code: string
  map: null
}>

// ---------------------------------------------------------------------------
// minifyJs — overloads for source map narrowing
// ---------------------------------------------------------------------------

/**
 * Minify JavaScript or TypeScript.
 *
 * @example
 * ```ts
 * import { minifyJs } from '@crustkit/minify'
 *
 * // Zero config
 * const { code } = minifyJs('var x = 1 + 2; console.log(x)')
 *
 * // With source map — `map` is guaranteed string
 * const { code, map } = minifyJs(src, { sourceMap: true, filename: 'app.js' })
 *
 * // Disable mangling
 * const { code } = minifyJs(src, { mangle: false })
 * ```
 */
export function minifyJs(code: string, options: JsOptions & { sourceMap: true }): MinifyResultWithMap
export function minifyJs(code: string, options?: JsOptions): MinifyResult
export function minifyJs(code: string, options?: JsOptions): MinifyResult {
  const result = _minifyJs(code, {
    mangle: options?.mangle,
    compress: options?.compress,
    sourceMap: options?.sourceMap,
    filename: options?.filename,
    module: options?.module,
  })

  return {
    code: result.code,
    map: result.map ?? null,
  }
}

// ---------------------------------------------------------------------------
// minifyCss — overloads for source map narrowing
// ---------------------------------------------------------------------------

/**
 * Minify CSS. Handles vendor prefixing, nesting, and modern syntax automatically.
 *
 * @example
 * ```ts
 * import { minifyCss } from '@crustkit/minify'
 *
 * const { code } = minifyCss('.foo { color: red; margin: 0px; }')
 * // '.foo{color:red;margin:0}'
 *
 * const { code, map } = minifyCss(src, { sourceMap: true })
 * ```
 */
export function minifyCss(code: string, options: CssOptions & { sourceMap: true }): MinifyResultWithMap
export function minifyCss(code: string, options?: CssOptions): MinifyResult
export function minifyCss(code: string, options?: CssOptions): MinifyResult {
  const result = _minifyCss(code, {
    sourceMap: options?.sourceMap,
    filename: options?.filename,
  })

  return {
    code: result.code,
    map: result.map ?? null,
  }
}

// ---------------------------------------------------------------------------
// minify — unified API with language auto-detection
// ---------------------------------------------------------------------------

export type MinifyOptions =
  | (JsOptions & { language?: 'js' })
  | (CssOptions & { language: 'css' })

/**
 * Minify code. Auto-detects language from `filename`, or set `language` explicitly.
 *
 * @example
 * ```ts
 * import { minify } from '@crustkit/minify'
 *
 * // Auto-detect from filename
 * minify('var x = 1', { filename: 'app.js' })
 * minify('.foo { color: red }', { filename: 'style.css' })
 *
 * // Explicit language
 * minify(code, { language: 'js' })
 * minify(code, { language: 'css' })
 *
 * // Default: JS
 * minify('var x = 1 + 2; console.log(x)')
 * ```
 */
export function minify(code: string, options?: MinifyOptions): MinifyResult {
  const lang = detectLanguage(options)

  if (lang === 'css') {
    return minifyCss(code, options as CssOptions)
  }
  return minifyJs(code, options as JsOptions)
}

// ---------------------------------------------------------------------------
// Terser drop-in — re-exported from ts/terser.ts
// ---------------------------------------------------------------------------

export {
  terser,
  type TerserOptions,
  type TerserResult,
  type TerserCompressOptions,
  type TerserMangleOptions,
  type TerserSourceMapOptions,
} from './terser'
