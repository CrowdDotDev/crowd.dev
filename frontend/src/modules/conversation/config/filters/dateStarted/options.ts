import { SelectFilterOptionGroup } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import moment from 'moment';

// Days period is -1 to include today's data
const options: SelectFilterOptionGroup[] = [
  {
    options: [
      {
        label: 'Last 24 hours',
        value: moment().utc().subtract(24, 'hour').format('YYYY-MM-DD'),
      },
      {
        label: 'Last 7 days',
        value: moment().utc().subtract(6, 'day').format('YYYY-MM-DD'),
      },
      {
        label: 'Last 14 days',
        value: moment().utc().subtract(13, 'day').format('YYYY-MM-DD'),
      },
      {
        label: 'Last 30 days',
        value: moment().utc().subtract(29, 'day').format('YYYY-MM-DD'),
      },
      {
        label: 'Last 90 days',
        value: moment().utc().subtract(89, 'day').format('YYYY-MM-DD'),
      },
    ],
  },
];

export default options;
