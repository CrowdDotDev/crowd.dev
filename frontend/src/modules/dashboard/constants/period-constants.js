// Period
export const ONE_DAY_PERIOD_FILTER = {
  label: '1d',
  extendedLabel: '1 day',
  value: 1,
  granularity: 'day',
};

export const SEVEN_DAYS_PERIOD_FILTER = {
  label: '7d',
  extendedLabel: '7 days',
  value: 7,
  granularity: 'day',
};

export const FOURTEEN_DAYS_PERIOD_FILTER = {
  label: '14d',
  extendedLabel: '2 weeks',
  value: 14,
  granularity: 'day',
};

export const THIRTY_DAYS_PERIOD_FILTER = {
  label: '30d',
  extendedLabel: 'month',
  value: 30,
  granularity: 'day',
};

export const THREE_MONTHS_PERIOD_FILTER = {
  label: '3m',
  extendedLabel: '3 months',
  value: 3,
  granularity: 'month',
};

export const SIX_MONTHS_PERIOD_FILTER = {
  label: '6m',
  extendedLabel: '6 months',
  value: 6,
  granularity: 'month',
};

const ONE_YEAR_PERIOD_FILTER = {
  label: '1y',
  extendedLabel: '1 year',
  value: 1,
  granularity: 'year',
};

export const ALL_TIME_PERIOD_FILTER = {
  label: 'All time',
  extendedLabel: 'All time',
  value: null,
  granularity: null,
};

export const DASHBOARD_PERIOD_OPTIONS = [
  SEVEN_DAYS_PERIOD_FILTER,
  FOURTEEN_DAYS_PERIOD_FILTER,
  THIRTY_DAYS_PERIOD_FILTER,
];

export const WIDGET_PERIOD_OPTIONS = [
  ...DASHBOARD_PERIOD_OPTIONS,
  THREE_MONTHS_PERIOD_FILTER,
  SIX_MONTHS_PERIOD_FILTER,
  ONE_YEAR_PERIOD_FILTER,
];

export const MONTHLY_WIDGET_PERIOD_OPTIONS = [
  SIX_MONTHS_PERIOD_FILTER,
  ONE_YEAR_PERIOD_FILTER,
  ALL_TIME_PERIOD_FILTER,
];

// Granularity
export const DAILY_GRANULARITY_FILTER = {
  label: 'Daily',
  value: 'day',
};

export const WEEKLY_GRANULARITY_FILTER = {
  label: 'Weekly',
  value: 'week',
};

export const MONTHLY_GRANULARITY_FILTER = {
  label: 'Monthly',
  value: 'month',
};

export const YEARLY_GRANULARITY_FILTER = {
  label: 'Yearly',
  value: 'year',
};

export const WIDGET_GRANULARITY_OPTIONS = [
  DAILY_GRANULARITY_FILTER,
  WEEKLY_GRANULARITY_FILTER,
  MONTHLY_GRANULARITY_FILTER,
];
