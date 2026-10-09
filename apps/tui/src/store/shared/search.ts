type SearchFields = {
  label: string
  context?: string
  metadata?: string
}

export function searchTerms(query: string): readonly string[] {
  const trimmed = query.trim().toLowerCase()
  return trimmed ? trimmed.split(/\s+/) : []
}

export function scoreSearch(
  terms: readonly string[],
  { label, context = '', metadata = '' }: SearchFields,
): number {
  const normalizedLabel = label.toLowerCase()
  const fields = [
    { text: normalizedLabel, penalty: 0 },
    { text: context.toLowerCase(), penalty: 100 },
    { text: metadata.toLowerCase(), penalty: 200 },
  ]
  let score = 0

  for (const term of terms) {
    let best = Infinity

    for (const field of fields) {
      const index = field.text.indexOf(term)
      if (index >= 0) {
        best = Math.min(best, field.penalty + index)
      }
    }

    if (best === Infinity) {
      return -1
    }

    score += best
  }

  if (terms.length > 1) {
    const phraseIndex = normalizedLabel.indexOf(terms.join(' '))
    return phraseIndex >= 0 ? phraseIndex : 1000 + score
  }

  return score
}
