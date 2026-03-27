/**
 * Forces TypeScript to expand intersection types into flat objects.
 * Instead of showing `MinifyResult & { map: string }` in IDE tooltips,
 * users see `{ code: string; map: string }`.
 *
 * Pattern from better-auth — zero runtime cost, pure compile-time DX.
 */
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}
