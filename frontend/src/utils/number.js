/**
 *
 * @param {*} number
 * @returns the original number into a short number format
 * Precision: 1 digit
 * 12 -> 12
 * 1,200 -> 1.2K
 * 12,200 -> 12.2K
 * 122,200 -> 122.2K
 * 1,222,200 -> 1.2M
 * 12,000,000 -> 12M
 * 122,000,000 -> 122M
 * 1,222,000,000 -> 1.2B
 * 1,022,222,222 -> 1B
 */
export const formatNumberToCompact = (number) => {
  if (typeof number !== 'number') {
    return '-'
  }

  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(number)
}

/**
 *
 * @param {*} number
 * @returns returns a string with a language-sensitive representation
 * of the original number
 */
export const formatNumber = (number) => {
  return number.toLocaleString('en-US')
}

export const formatPercentage = (percentage) => {
  return `${Math.ceil(
    percentage < 0 ? percentage * -1 : percentage
  )} %`
}

export const formatRevenueRange = (range) => {
  const min =
    range.min > 1000 ? `$${range.min}B` : `$${range.min}M`
  const max =
    range.max > 1000 ? `$${range.max}B` : `$${range.max}M`
  return `${min}-${max}`
}
