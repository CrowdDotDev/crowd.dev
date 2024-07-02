import { SelectFilterOptionGroup } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';

// Days period is -1 to include today's data
const options: SelectFilterOptionGroup[] = [
  {
    options: [
      {
        label: 'Person',
        value: 'contributor',
      },
      {
        label: 'Organization',
        value: 'organization',
      },
      {
        label: 'Integration',
        value: 'integration',
      },
    ],
  },
];

export default options;
