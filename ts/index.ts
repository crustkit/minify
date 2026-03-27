import { minifyJs as _minifyJs, minifyCss as _minifyCss } from './binding'

// ---------------------------------------------------------------------------
// JS Options & Result
// ---------------------------------------------------------------------------

export interface JsOptions {
  /** Shorten variable names. @default true */
  mangle?: boolean

  /** Dead code elimination & constant folding. @default true */
  compress?: boolean

  /** Generate a source map. @default false */
  sourceMap?: boolean

  /** Filename — used for source maps and error messages. */
  filename?: string

  /**
   * Treat as ES module.
   * @default auto-detected from filename extension (.mjs = module)
   */
  module?: boolean
}

// ---------------------------------------------------------------------------
// CSS Options & Result
// ---------------------------------------------------------------------------

export interface CssOptions {
  /** Generate a source map. @default false */
  sourceMap?: boolean

  /** Filename — used for source maps and error messages. */
  filename?: string
}

// ---------------------------------------------------------------------------
// Shared result types with source map narrowing
// ---------------------------------------------------------------------------

export interface MinifyResult {
  /** The minified code. */
  code: string
  /** Source map JSON string. Only present when `sourceMap: true`. */
  map: string | null
}

export interface MinifyResultWithMap {
  code: string
  /** Source map JSON string. Guaranteed present. */
  map: string
}

export interface MinifyResultWithoutMap {
  code: string
  map: null
}

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
// Terser drop-in — accepts terser's API shape, runs Rust underneath
// ---------------------------------------------------------------------------

export interface TerserCompressOptions {
  /** Number of compression passes. @default 1 */
  passes?: number
  /** Remove `debugger` statements. @default true */
  drop_debugger?: boolean
  /** Remove `console.*` calls. @default false */
  drop_console?: boolean
  /** Remove unreachable code. @default true */
  dead_code?: boolean
  /** Join consecutive var/let/const statements. @default true */
  join_vars?: boolean
  /** Allow other compress options terser accepts. */
  [key: string]: unknown
}

export interface TerserMangleOptions {
  /** Mangle top-level names. @default false */
  toplevel?: boolean
  /** Names to keep unmangled. */
  reserved?: string[]
  /** Allow other mangle options terser accepts. */
  [key: string]: unknown
}

export interface TerserSourceMapOptions {
  /** Source map URL to embed in the output. */
  url?: string
  /** Original filename for source map. */
  filename?: string
}

export interface TerserOptions {
  compress?: boolean | TerserCompressOptions
  mangle?: boolean | TerserMangleOptions
  sourceMap?: boolean | TerserSourceMapOptions
  module?: boolean
  toplevel?: boolean
}

export interface TerserResult {
  code: string
  map?: string
}

/**
 * Terser-compatible drop-in replacement.
 *
 * @example
 * ```ts
 * // Before:
 * import { minify } from 'terser'
 *
 * // After — just change the import:
 * import { terser as minify } from '@crustkit/minify'
 *
 * const result = await minify(code, { compress: true, mangle: true })
 * ```
 *
 * Returns a Promise for API compatibility. The work is synchronous in Rust.
 */
export async function terser(
  code: string | Record<string, string>,
  options?: TerserOptions,
): Promise<TerserResult> {
  let input: string
  let filename: string | undefined

  if (typeof code === 'string') {
    input = code
  } else {
    const entries = Object.entries(code)
    if (entries.length === 0) {
      return { code: '' }
    }
    filename = entries[0][0]
    input = entries.map(([, src]) => src).join(';\n')
  }

  const doSourceMap = options?.sourceMap != null && options.sourceMap !== false
  const mapFilename =
    typeof options?.sourceMap === 'object' ? options.sourceMap.filename : undefined

  const result = _minifyJs(input, {
    mangle: options?.mangle !== false,
    compress: options?.compress !== false,
    sourceMap: doSourceMap,
    filename: mapFilename ?? filename,
    module: options?.module,
  })

  return {
    code: result.code,
    map: result.map ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CSS_EXTS = new Set(['.css', '.scss', '.sass', '.less'])

function detectLanguage(options?: MinifyOptions): 'js' | 'css' {
  if (options && 'language' in options && options.language) return options.language

  const filename = 'filename' in (options ?? {}) ? (options as { filename?: string })?.filename : undefined
  if (filename) {
    const ext = filename.slice(filename.lastIndexOf('.'))
    if (CSS_EXTS.has(ext)) return 'css'
  }

  return 'js'
}
