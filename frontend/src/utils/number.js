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

export const formatNumberToRange = (number) => {
  if (number >= 1 && number <= 10) {
    return '1-10'
  } else if (number >= 11 && number <= 50) {
    return '11-50'
  } else if (number >= 51 && number <= 200) {
    return '51-200'
  } else if (number >= 501 && number <= 1000) {
    return '501-1000'
  } else if (number >= 1001 && number <= 5000) {
    return '1001-5000'
  } else if (number >= 5001 && number <= 10000) {
    return '5001-10000'
  } else if (number >= 10001) {
    return '10001+'
  }
}

export const formatRevenueRange = (range) => {
  const min =
    range.min > 1000 ? `$${range.min}B` : `$${range.min}B`
  const max =
    range.max > 1000 ? `$${range.max}B` : `$${range.max}B`
  return `${min}-${max}`
}
