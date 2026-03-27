import { minifyJs as _minifyJs } from './binding'

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
