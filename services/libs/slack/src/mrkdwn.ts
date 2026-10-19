export function escapeSlackText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function formatSlackTime(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return 'an unknown time'
  }
  const fallback = `${date.toISOString().slice(11, 16)} UTC`
  return `<!date^${Math.floor(date.getTime() / 1000)}^{time}|${fallback}>`
}
