import { describe, it, expect } from 'vitest'
import { minifyJs, minifyCss, minify, terser } from '../ts/index'

describe('minifyJs', () => {
  it('works with zero config', () => {
    const { code } = minifyJs('var x = 1 + 2; console.log(x);')
    expect(code).toContain('console.log')
    expect(code).toContain('3')
  })

  it('returns null map by default', () => {
    const { map } = minifyJs('var x = 1; console.log(x);')
    expect(map).toBeNull()
  })

  it('returns string map when sourceMap: true', () => {
    const { map } = minifyJs('export const x = 1;', {
      sourceMap: true,
      filename: 'test.js',
      module: true,
    })
    expect(typeof map).toBe('string')
    expect(map).toContain('"mappings"')
  })

  it('respects mangle: false', () => {
    const { code } = minifyJs(
      'export function hello(longName) { return longName + 1; }',
      { module: true, mangle: false },
    )
    expect(code).toContain('longName')
  })

  it('respects compress: false', () => {
    const { code } = minifyJs('var x = 1 + 2; console.log(x);', { compress: false })
    expect(code).toContain('1+2')
  })

  it('handles empty input', () => {
    const { code } = minifyJs('')
    expect(code).toBe('')
  })

  it('throws readable error on invalid syntax', () => {
    expect(() => minifyJs('const const const')).toThrow(/Parse error/)
  })
})

describe('minifyCss', () => {
  it('works with zero config', () => {
    const { code } = minifyCss('.foo { color: red; margin: 0px; }')
    expect(code).not.toContain('  ')
    expect(code).not.toContain('0px')
  })

  it('returns null map by default', () => {
    const { map } = minifyCss('.foo { color: red; }')
    expect(map).toBeNull()
  })

  it('returns string map when sourceMap: true', () => {
    const { map } = minifyCss('.foo { color: red; }', {
      sourceMap: true,
      filename: 'test.css',
    })
    expect(typeof map).toBe('string')
  })

  it('handles empty input', () => {
    const { code } = minifyCss('')
    expect(code).toBe('')
  })

  it('throws readable error on invalid CSS', () => {
    expect(() => minifyCss('{{{{invalid')).toThrow()
  })
})

describe('minify (unified)', () => {
  it('defaults to JS', () => {
    const { code } = minify('var x = 1 + 2; console.log(x);')
    expect(code).toContain('3')
  })

  it('detects CSS from .css filename', () => {
    const { code } = minify('.foo { margin: 0px; }', { filename: 'style.css' })
    expect(code).not.toContain('0px')
  })

  it('detects CSS from .scss filename', () => {
    const { code } = minify('.foo { color: red; }', { filename: 'style.scss' })
    expect(code).toContain('.foo')
  })

  it('respects explicit language: css', () => {
    const { code } = minify('.foo { margin: 0px; }', { language: 'css' })
    expect(code).not.toContain('0px')
  })

  it('respects explicit language: js', () => {
    const { code } = minify('var x = 1 + 2; console.log(x);', { language: 'js' })
    expect(code).toContain('3')
  })
})

describe('terser (drop-in)', () => {
  it('returns a Promise', () => {
    const result = terser('var x = 1;')
    expect(result).toBeInstanceOf(Promise)
  })

  it('minifies string input', async () => {
    const { code } = await terser('var x = 1 + 2; console.log(x);')
    expect(code).toContain('3')
  })

  it('accepts object input (multi-file)', async () => {
    const { code } = await terser({
      'a.js': 'var a = 1;',
      'b.js': 'var b = 2; console.log(b);',
    })
    expect(code).toContain('console.log')
  })

  it('returns empty string for empty object input', async () => {
    const { code } = await terser({})
    expect(code).toBe('')
  })

  it('handles compress options', async () => {
    const { code } = await terser('var x = 1; debugger; console.log(x);', {
      compress: { drop_debugger: true },
    })
    expect(code).not.toContain('debugger')
  })

  it('handles mangle: false', async () => {
    const { code } = await terser(
      'function hello(longName) { return longName + 1; }; hello(1);',
      { mangle: false },
    )
    expect(code).toContain('longName')
  })

  it('returns source map when requested', async () => {
    const { map } = await terser('var x = 1; console.log(x);', {
      sourceMap: true,
    })
    expect(map).toBeDefined()
    expect(map).toContain('"mappings"')
  })
})
