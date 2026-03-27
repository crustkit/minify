/**
 * Type-level tests — these don't run, they just compile.
 * If this file has type errors, the DX is broken.
 */
import { minify, minifyJs, minifyCss, terser } from '../ts/index'
import type {
  JsOptions,
  CssOptions,
  MinifyResult,
  MinifyResultWithMap,
  MinifyResultWithoutMap,
} from '../ts/index'

// ---------------------------------------------------------------------------
// minifyJs — zero config works
// ---------------------------------------------------------------------------
{
  const result = minifyJs('var x = 1')
  const code: string = result.code
  const map: string | null = result.map
}

// ---------------------------------------------------------------------------
// minifyJs — source map narrows the return type
// ---------------------------------------------------------------------------
{
  const result = minifyJs('var x = 1', { sourceMap: true })
  //    ^? MinifyResultWithMap
  const map: string = result.map // ← no `| null`, guaranteed string
}

// ---------------------------------------------------------------------------
// minifyJs — all JS options available
// ---------------------------------------------------------------------------
{
  minifyJs('code', {
    mangle: false,
    compress: true,
    sourceMap: true,
    filename: 'app.js',
    module: true,
  })
}

// ---------------------------------------------------------------------------
// minifyCss — zero config works
// ---------------------------------------------------------------------------
{
  const result = minifyCss('.foo { color: red }')
  const code: string = result.code
}

// ---------------------------------------------------------------------------
// minifyCss — source map narrows
// ---------------------------------------------------------------------------
{
  const result = minifyCss('.foo { color: red }', { sourceMap: true })
  const map: string = result.map
}

// ---------------------------------------------------------------------------
// minifyCss — does NOT accept JS-specific options
// ---------------------------------------------------------------------------
{
  // @ts-expect-error — mangle is not a CSS option
  minifyCss('.foo {}', { mangle: true })

  // @ts-expect-error — compress is not a CSS option
  minifyCss('.foo {}', { compress: true })

  // @ts-expect-error — module is not a CSS option
  minifyCss('.foo {}', { module: true })
}

// ---------------------------------------------------------------------------
// minify — unified API, language detection
// ---------------------------------------------------------------------------
{
  // Default: JS
  minify('var x = 1')

  // Auto-detect from filename
  minify('.foo {}', { filename: 'style.css' })

  // Explicit language
  minify('var x = 1', { language: 'js', mangle: true })
  minify('.foo {}', { language: 'css' })
}

// ---------------------------------------------------------------------------
// terser — drop-in compat
// ---------------------------------------------------------------------------
{
  // String input
  const r1: Promise<{ code: string; map?: string }> = terser('var x = 1')

  // Object input (multi-file)
  terser({ 'a.js': 'var a = 1', 'b.js': 'var b = 2' })

  // All terser options
  terser('code', {
    compress: { passes: 2, drop_console: true },
    mangle: { toplevel: true },
    sourceMap: { filename: 'bundle.js' },
    module: true,
  })

  // Boolean shorthand (like terser)
  terser('code', { compress: true, mangle: false })
}
