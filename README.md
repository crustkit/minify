# @crustkit/minify

JS and CSS minification that just works.

Terser needs a config file. cssnano needs PostCSS. Neither has real TypeScript support. This is one import, zero config, and typed all the way down.

## Install

```bash
npm install @crustkit/minify
```

## Usage

```ts
import { minifyJs, minifyCss } from '@crustkit/minify'

const { code } = minifyJs('var x = 1 + 2; console.log(x)')
// => 'console.log(3);'

const { code: css } = minifyCss('.foo { color: red; margin: 0px; }')
// => '.foo{color:red;margin:0}'
```

That's it. No config files. No plugins. No pipeline.

## Types that actually help

When you pass `sourceMap: true`, TypeScript narrows the return type. `map` is a `string`, not `string | null`. No runtime checks needed.

```ts
// Without source map — map is null
const { code, map } = minifyJs(src)
//                     map: string | null

// With source map — map is guaranteed
const { code, map } = minifyJs(src, { sourceMap: true, filename: 'app.js' })
//                     map: string ✓
```

CSS functions only accept CSS options. Passing `mangle` or `compress` is a type error, not a silent no-op.

```ts
minifyCss(code, { mangle: true })
//                ^^^^^^ — type error, not a runtime surprise
```

## CSS without PostCSS

Lightning CSS handles vendor prefixing, nesting, and modern CSS syntax natively. No PostCSS pipeline, no extra dependencies.

```ts
const { code } = minifyCss('.foo { color: red; margin: 0px; }')
// => '.foo{color:red;margin:0}'
```

## Auto-detect from filename

```ts
import { minify } from '@crustkit/minify'

minify(code, { filename: 'app.js' })    // → JS
minify(code, { filename: 'style.css' }) // → CSS
```

## Switching from terser

Change one import. Everything else stays the same.

```ts
// before
import { minify } from 'terser'

// after
import { terser as minify } from '@crustkit/minify'

const result = await minify(code, {
  compress: { drop_console: true },
  mangle: true,
})
```

Returns a Promise for API compatibility. The work is synchronous under the hood.

## JS options

```ts
minifyJs(code, {
  mangle: true,       // shorten variable names (default: true)
  compress: true,     // dead code elimination (default: true)
  sourceMap: false,    // generate source map (default: false)
  filename: 'app.js', // for source maps and error messages
  module: true,        // treat as ES module
})
```

## CSS options

```ts
minifyCss(code, {
  sourceMap: false,        // generate source map (default: false)
  filename: 'style.css',  // for source maps and error messages
})
```

## Under the hood

Built on [oxc](https://oxc.rs) (JS) and [Lightning CSS](https://lightningcss.dev) (CSS). Rust under the hood, npm on the surface.

## License

MIT
