import { attributesTypes } from '@/modules/organization/types/Attributes';

export const revenueRangesOptions = [
  {
    label: '$0-1M',
    value: {
      min: 0,
      max: 1,
    },
  },
  {
    label: '$1M-$10M',
    value: {
      min: 1,
      max: 10,
    },
  },
  {
    label: '$10M-$25M',
    value: {
      min: 10,
      max: 25,
    },
  },
  {
    label: '$25M-$50M',
    value: {
      min: 25,
      max: 50,
    },
  },
  {
    label: '$50M-$100M',
    value: {
      min: 50,
      max: 100,
    },
  },
  {
    label: '$100M-$250M',
    value: {
      min: 100,
      max: 250,
    },
  },
  {
    label: '$250M-$500M',
    value: {
      min: 250,
      max: 500,
    },
  },
  {
    label: '$500M-$1B',
    value: {
      min: 500,
      max: 1000,
    },
  },
  {
    label: '$1B-$10B',
    value: {
      min: 1000,
      max: 10000,
    },
  },
  {
    label: '$10B+',
    value: {
      min: 10000,
    },
  },
];

export default {
  name: 'revenueRange',
  label: 'Annual Revenue',
  type: attributesTypes.string,
  showInForm: false,
  showInAttributes: false,
  displayValue: (value) => {
    if (!value) {
      return '-';
    }

    return revenueRangesOptions.find((range) => range.value.min === value.min && range.value.max === value.max)?.label || value;
  },
};
