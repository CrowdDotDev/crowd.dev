export default function moneyFormatter(
  amount,
  currency = 'USD'
) {
  const options = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }

  if ((amount * 100) % 100 === 0) {
    options.minimumFractionDigits = 0
  }

  const formatter = new Intl.NumberFormat('en-US', options)
  return formatter.format(amount)
}
