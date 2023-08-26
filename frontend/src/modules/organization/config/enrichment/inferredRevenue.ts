import { attributesTypes } from '@/modules/organization/types/Attributes';

export const revenueRangesOptions = [
  {
    label: '$0-$1M',
    value: '0-1,000,000',
  },
  {
    label: '$1M-$10M',
    value: '1,000,000-10,000,000',
  },
  {
    label: '$10M-$25M',
    value: '10,000,000-25,000,000',
  },
  {
    label: '$25M-$50M',
    value: '25,000,000-50,000,000',
  },
  {
    label: '$50M-$100M',
    value: '50,000,000-100,000,000',
  },
  {
    label: '$100M-$250M',
    value: '100,000,000-250,000,000',
  },
  {
    label: '$250M-$500M',
    value: '250,000,000-500,000,000',
  },
  {
    label: '$500M-$1B',
    value: '500,000,000-1,000,000,000',
  },
  {
    label: '$1B-$10B',
    value: '1,000,000,000-10,000,000,000',
  },
  {
    label: '$10B+',
    value: '10,000,000,000+',
  },
];

export const revenueRanges = {
  '0-1,000,000': '$0-$1M',
  '1,000,000-10,000,000': '$1M-$10M',
  '10,000,000-25,000,000': '$10M-$25M',
  '25,000,000-50,000,000': '$25M-$50M',
  '50,000,000-100,000,000': '$50M-$100M',
  '100,000,000-250,000,000': '$100M-$250M',
  '250,000,000-500,000,000': '$250M-$500M',
  '500,000,000-1,000,000,000': '$500M-$1B',
  '1,000,000,000-10,000,000,000': '$1B-$10B',
  '10,000,000,000+': '$10B+',
};

export default {
  name: 'inferredRevenue',
  label: 'Inferred Revenue',
  type: attributesTypes.string,
  showInForm: false,
  showInAttributes: false,
  displayValue: (value) => {
    if (!value) {
      return '-';
    }

    return revenueRanges[value] || value;
  },
};
