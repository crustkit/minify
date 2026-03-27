// Re-export from the napi-rs generated loader.
// The generated index.js handles cross-platform .node binary resolution.

export interface JsMinifyOptions {
  mangle?: boolean | null
  compress?: boolean | null
  sourceMap?: boolean | null
  filename?: string | null
  module?: boolean | null
}

export interface JsMinifyResult {
  code: string
  map?: string | null
}

export interface CssMinifyOptions {
  filename?: string | null
  sourceMap?: boolean | null
}

export interface CssMinifyResult {
  code: string
  map?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const native = require('../index.js') as {
  minifyJs(code: string, options?: JsMinifyOptions | null): JsMinifyResult
  minifyCss(code: string, options?: CssMinifyOptions | null): CssMinifyResult
}

export const minifyJs = native.minifyJs
export const minifyCss = native.minifyCss
