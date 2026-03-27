import { describe, it, expect } from 'vitest'

// Test against native binding directly for smoke tests
const binding = require('../crustkit-minify.linux-x64-gnu.node')

describe('minifyJs', () => {
  it('minifies basic JS with side effects', () => {
    const input = 'var foo = 1 + 2; console.log(foo);'
    const result = binding.minifyJs(input, {})
    expect(result.code).toBeDefined()
    expect(result.code.length).toBeLessThan(input.length)
    expect(result.code).toContain('console.log')
  })

  it('folds constants', () => {
    const result = binding.minifyJs('var x = 1 + 2; console.log(x);', {})
    expect(result.code).toContain('3')
  })

  it('eliminates dead code in module scope', () => {
    const result = binding.minifyJs('const unused = 42;', { module: true })
    expect(result.code).toBe('')
  })

  it('mangles local variable names by default', () => {
    const result = binding.minifyJs(
      'export function hello() { var longVariableName = 42; return longVariableName + 1; }',
      { module: true },
    )
    expect(result.code).not.toContain('longVariableName')
  })

  it('respects mangle: false', () => {
    const result = binding.minifyJs(
      'export function hello(longVariableName) { return longVariableName + 1; }',
      { module: true, mangle: false },
    )
    expect(result.code).toContain('longVariableName')
  })

  it('generates source maps when requested', () => {
    const result = binding.minifyJs('export const foo = 1 + 2;', {
      sourceMap: true,
      filename: 'test.js',
      module: true,
    })
    expect(result.map).toBeDefined()
    expect(result.map).toContain('"mappings"')
  })

  it('returns null map when not requested', () => {
    const result = binding.minifyJs('var x = 1; console.log(x);', {})
    expect(result.map).toBeFalsy()
  })

  it('handles ES modules', () => {
    const result = binding.minifyJs(
      'export const foo = 1; export function bar() { return foo; }',
      { module: true },
    )
    expect(result.code).toBeDefined()
    expect(result.code).toContain('export')
  })

  it('throws on invalid syntax', () => {
    expect(() => {
      binding.minifyJs('const const const', {})
    }).toThrow()
  })
})

describe('minifyCss', () => {
  it('minifies basic CSS', () => {
    const result = binding.minifyCss('.foo { color: red; margin: 0px; }', {})
    expect(result.code).toBeDefined()
    expect(result.code).not.toContain('  ')
    expect(result.code.length).toBeLessThan('.foo { color: red; margin: 0px; }'.length)
  })

  it('removes unnecessary units', () => {
    const result = binding.minifyCss('.foo { margin: 0px; }', {})
    expect(result.code).toContain('0')
    expect(result.code).not.toContain('0px')
  })

  it('generates source maps when requested', () => {
    const result = binding.minifyCss('.foo { color: red; }', {
      sourceMap: true,
      filename: 'test.css',
    })
    expect(result.map).toBeDefined()
  })

  it('throws on invalid CSS', () => {
    expect(() => {
      binding.minifyCss('{{{{invalid', {})
    }).toThrow()
  })
})
