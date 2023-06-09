import { SelectFilterOptionGroup } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import moment from 'moment';

const options: SelectFilterOptionGroup[] = [
  {
    options: [
      {
        label: 'Last 24 hours',
        value: moment().subtract(24, 'hour').format('YYYY-MM-DD'),
      },
      {
        label: 'Last 7 days',
        value: moment().subtract(7, 'day').format('YYYY-MM-DD'),
      },
      {
        label: 'Last 14 days',
        value: moment().subtract(14, 'day').format('YYYY-MM-DD'),
      },
      {
        label: 'Last 30 days',
        value: moment().subtract(30, 'day').format('YYYY-MM-DD'),
      },
      {
        label: 'Last 90 days',
        value: moment().subtract(90, 'day').format('YYYY-MM-DD'),
      },
    ],
  },
];

export default options;
