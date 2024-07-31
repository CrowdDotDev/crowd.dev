import moment from 'moment';
import config from '@/config';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

/**
 * Time ago utility
 *
 * This is a small wrapper of the moment(date).fromNow() method, to handle our data-related exception regarding
 * the year 1970, replacing the default label ("52 years ago") to "some time ago".
 *
 * @param timestamp
 * @returns {string|string}
 */
export const formatDateToTimeAgo = (timestamp) => (moment.utc(timestamp).year() < 2000
  ? 'some time ago'
  : moment.utc(timestamp).fromNow());

export const formatDateToTimeAgoForIntegrations = (timestamp) => {
  dayjs.extend(relativeTime, {
    thresholds: [
      { l: 's', r: 1 },
      { l: 'm', r: 1 },
      { l: 'mm', r: 59, d: 'minute' },
      { l: 'h', r: 1 },
      { l: 'hh', r: 23, d: 'hour' },
      { l: 'd', r: 1 },
      { l: 'dd', r: 29, d: 'day' },
      { l: 'M', r: 1 },
      { l: 'MM', r: 11, d: 'month' },
      { l: 'y', r: 1 },
      { l: 'yy', d: 'year' },
    ],
  });

  return dayjs().to(dayjs(timestamp));
};

/**
 *
 * @param {string} timestamp
 * @param {number} subtractDays
 * @param {number} subtractMonths
 * @param {string} format (default: "YYYY-MM-DD")
 * @returns timestamp in format
 */
export const formatDate = ({
  timestamp = null,
  subtractDays,
  subtractMonths,
  subtractYears,
  format = 'YYYY-MM-DD',
}) => {
  const date = timestamp ? moment(timestamp) : moment();

  if (subtractDays) {
    date.subtract(subtractDays, 'days');
  }

  if (subtractMonths) {
    date.subtract(subtractMonths, 'months');
  }

  if (subtractYears) {
    date.subtract(subtractYears, 'years');
  }

  return date.format(format);
};

export const getTrialDate = (tenant) => {
  if (config.isCommunityVersion || !tenant.isTrialPlan) {
    return null;
  }

  const daysLeft = moment(tenant.trialEndsAt).diff(
    moment(),
    'days',
  );

  return `Trial (${daysLeft < 0 ? 0 : daysLeft} days left)`;
};

export const isCurrentDateAfterGivenWorkingDays = (date, workingDays = 3) => {
  const givenDate = new Date(date);
  let workingDaysAdded = 0;

  while (workingDaysAdded < workingDays) {
    givenDate.setDate(givenDate.getDate() + 1);

    // Check if the current day is a weekend day (Saturday or Sunday)
    const isWeekendDay = givenDate.getDay() === 0 || givenDate.getDay() === 6;

    if (!isWeekendDay) {
      workingDaysAdded += 1;
    }
  }

  return new Date() > givenDate;
};
