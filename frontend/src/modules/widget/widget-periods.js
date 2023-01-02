export const SEVEN_DAYS_PERIOD_FILTER = {
  label: '7d',
  value: 7,
  granularity: 'day'
}

export const FOURTEEN_DAYS_PERIOD_FILTER = {
  label: '14d',
  value: 14,
  granularity: 'day'
}

export const THIRTY_DAYS_PERIOD_FILTER = {
  label: '30d',
  value: 30,
  granularity: 'day'
}

export const THREE_MONTHS_PERIOD_FILTER = {
  label: '3m',
  value: 3,
  granularity: 'month'
}

export const SIX_MONTHS_PERIOD_FILTER = {
  label: '6m',
  value: 6,
  granularity: 'month'
}

export const ONE_YEAR_PERIOD_FILTER = {
  label: '1y',
  value: 1,
  granularity: 'year'
}

export const DASHBOARD_PERIOD_OPTIONS = [
  SEVEN_DAYS_PERIOD_FILTER,
  FOURTEEN_DAYS_PERIOD_FILTER,
  THIRTY_DAYS_PERIOD_FILTER
]

export const WIDGET_PERIOD_OPTIONS = [
  ...DASHBOARD_PERIOD_OPTIONS,
  THREE_MONTHS_PERIOD_FILTER,
  SIX_MONTHS_PERIOD_FILTER,
  ONE_YEAR_PERIOD_FILTER
]
