# @crustkit/minify

JS and CSS minification. Zero config, great defaults, typed to the bone.

Built on [oxc](https://oxc.rs) (JS) and [Lightning CSS](https://lightningcss.dev) (CSS). Rust under the hood, npm on the surface.

## Install

```bash
npm install @crustkit/minify
```

## Usage

```ts
import { minifyJs, minifyCss, minify } from '@crustkit/minify'

// JS -- zero config
const { code } = minifyJs('var x = 1 + 2; console.log(x)')
// => 'console.log(3);'

// CSS -- zero config
const { code } = minifyCss('.foo { color: red; margin: 0px; }')
// => '.foo{color:red;margin:0}'

// Auto-detect from filename
const result = minify(code, { filename: 'app.js' })
const result = minify(code, { filename: 'style.css' })
```

### Source maps

When you pass `sourceMap: true`, the return type narrows. TypeScript knows `map` is a `string`, not `string | null`.

```ts
const { code, map } = minifyJs(src, { sourceMap: true, filename: 'app.js' })
//                                     ^-- map: string (guaranteed)
```

### JS options

```ts
minifyJs(code, {
  mangle: true,       // shorten variable names (default: true)
  compress: true,     // dead code elimination (default: true)
  sourceMap: false,    // generate source map (default: false)
  filename: 'app.js', // for source maps and error messages
  module: true,        // treat as ES module
})
```

### CSS options

CSS functions only accept CSS options. Passing `mangle` or `compress` is a type error.

```ts
minifyCss(code, {
  sourceMap: false,
  filename: 'style.css',
})

minifyCss(code, { mangle: true })
//                ^^^^^^ -- type error
```

### Terser drop-in

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

Returns a Promise for API compatibility with terser. The work is synchronous in Rust.

## What it does

- **JS**: Parses with oxc, compresses (constant folding, dead code elimination, inlining), mangles variable names, generates source maps. Handles ES modules, CommonJS, JSX, TypeScript.
- **CSS**: Parses with Lightning CSS, minifies whitespace, shortens values (`0px` to `0`), handles vendor prefixing, nesting, and modern CSS syntax.

## License

MIT
