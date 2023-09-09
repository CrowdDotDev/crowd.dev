import {
  ALL_TIME_PERIOD_FILTER,
  WIDGET_PERIOD_OPTIONS,
  WIDGET_GRANULARITY_OPTIONS,
  WEEKLY_GRANULARITY_FILTER,
  SEVEN_DAYS_PERIOD_FILTER,
  MONTHLY_GRANULARITY_FILTER,
  FOURTEEN_DAYS_PERIOD_FILTER,
  THREE_MONTHS_PERIOD_FILTER,
} from './widget-constants';

export const getSelectedPeriodFromLabel = (
  label,
  defaultMinimumPeriod,
  granularity
) => {
  if (label === 'All time') return ALL_TIME_PERIOD_FILTER;

  let selectedPeriod = WIDGET_PERIOD_OPTIONS.find(
    (option) => option.label === label
  );

  if (granularity) {
    selectedPeriod = getGranularityBasedPeriod(granularity, selectedPeriod);
  }

  if (selectedPeriod && comparePeriods(selectedPeriod, defaultMinimumPeriod)) {
    return selectedPeriod;
  }

  return defaultMinimumPeriod;
};

export const getSelectedGranularityFromLabel = (
  label,
  defaultMinimumGranularity
) => {
  const selectedGranularity = WIDGET_GRANULARITY_OPTIONS.find(
    (option) => option.label === label
  );

  if (
    selectedGranularity &&
    compareGranularityValues(
      selectedGranularity.value,
      defaultMinimumGranularity.value
    )
  ) {
    return selectedGranularity;
  }

  return defaultMinimumGranularity;
};

const compareGranularityValues = (a, b) => {
  if (a === 'year' || b === 'day' || a === b) return 1;

  if (
    a === 'day' ||
    (a === 'month' && b === 'year') ||
    (a === 'week' && ['year', 'month'].includes(b))
  ) {
    return -1;
  }

  return 1;
};

const comparePeriods = (a, b) => {
  if (a.granularity === b.granularity) return a.value > b.value;

  if (a.granularity === 'day' || b.granularity === 'year') return -1;

  return 1;
};

const getGranularityBasedPeriod = (granularity, period) => {
  if (
    granularity.value === WEEKLY_GRANULARITY_FILTER.value &&
    period.label === SEVEN_DAYS_PERIOD_FILTER.label
  ) {
    return FOURTEEN_DAYS_PERIOD_FILTER;
  }

  if (
    granularity.value === MONTHLY_GRANULARITY_FILTER.value &&
    period.granularity === 'day'
  ) {
    return THREE_MONTHS_PERIOD_FILTER;
  }

  return period;
};
