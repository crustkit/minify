const CSS_EXTS = new Set(['.css', '.scss', '.sass', '.less'])

export function detectLanguage(options?: { language?: string; filename?: string }): 'js' | 'css' {
  if (options?.language === 'css') return 'css'
  if (options?.language === 'js') return 'js'

  if (options?.filename) {
    const ext = options.filename.slice(options.filename.lastIndexOf('.'))
    if (CSS_EXTS.has(ext)) return 'css'
  }

  return 'js'
}
