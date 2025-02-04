import { dateHelper } from '@/shared/date-helper/date-helper';

const weekdays = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

const parseDate = (date, granularity) => {
  // For granularity MONTH
  // Show label as full month (e.g January)
  if (granularity === 'year') {
    return [date.format('YYYY')];
  } if (granularity === 'month') {
    return [date.format('MMMM YYYY')];
  } if (granularity === 'week') {
    // For granularity WEEK
    // Show label as range between start and end of week
    // (e.g Nov 14 - Nov 20)
    const startDate = date.format('MMM DD');
    const endDate = date.add(6, 'day').format('MMM DD');

    return [`${startDate} - ${endDate}`];
  }

  // For granularity DAY
  // Show label as day with weekday (e.g Thu, Jan 12 )
  return `${weekdays[date.weekday()]}, ${date.format(
    'MMM DD',
  )}`;
};

export const parseTooltipTitle = (context) => {
  const { granularity } = context[0].dataset;
  const { label: title } = context[0];
  const date = dateHelper(title);

  return parseDate(date, granularity);
};

export const formatTooltipTitle = (context) => {
  const {
    dataset: { data, label },
    dataIndex,
  } = context;

  return `
    ${data[dataIndex]} ${label.toLowerCase()}
  `;
};

export const parseTooltipBody = (context) => {
  const {
    dataIndex,
    dataset: { data, granularity },
    label,
  } = context;

  // Don't render body on first data point
  if (dataIndex === 0) {
    return null;
  }

  const currentPoint = data[dataIndex];
  const previousPoint = data[dataIndex - 1];
  const difference = currentPoint - previousPoint;

  let percDiff;

  // Calculate percentage of difference between both values
  if (currentPoint === 0 && difference === 0) {
    percDiff = 0;
  } else if (currentPoint === 0 || previousPoint === 0) {
    percDiff = 100;
  } else {
    percDiff = (difference / previousPoint) * 100;
  }

  const date = dateHelper(label);
  let previousDate;

  // For granularity WEEK
  // Show label as range between start and end of week
  // (e.g Nov 14 - Nov 20)
  if (granularity === 'week') {
    const startDate = dateHelper(label)
      .subtract(7, 'day')
      .format('MMM DD');
    const endDate = dateHelper(label)
      .subtract(1, 'day')
      .format('MMM DD');

    previousDate = `${startDate} - ${endDate}`;
    // For granularity MONTH
    // Show label as full month (e.g January)
  } else if (granularity === 'month') {
    previousDate = date
      .subtract(1, 'month')
      .format('MMMM YYYY');
    // For granularity DAY
    // Show label as day (e.g Jan 12 )
  } else if (granularity === 'year') {
    previousDate = date.subtract(1, 'year').format('YYYY');
  } else {
    previousDate = date.subtract(1, 'day').format('MMM DD');
  }

  return {
    difference,
    growth: Math.round(percDiff),
    previousDate,
  };
};

export const parseAxisLabel = (label, granularity) => {
  const date = dateHelper(label);

  return parseDate(date, granularity);
};

export const getTimeGranularityFromPeriod = (period) => {
  if (period.granularity === 'month') {
    return 'week';
  } if (period.granularity === 'year') {
    return 'month';
  }

  return 'day';
};
