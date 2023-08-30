import { attributesTypes } from '@/modules/organization/types/Attributes';

const getValue = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  return `$${value >= 1000 ? value / 1000 : value}${value >= 1000 ? 'B' : 'M'}`;
};

const getMiddle = (min, max) => {
  if (min && max) {
    return '-';
  }

  if (min && !max) {
    return '+';
  }

  return '';
};

export default {
  name: 'revenueRange',
  label: 'Annual Revenue',
  type: attributesTypes.string,
  showInForm: false,
  showInAttributes: false,
  displayValue: (value) => {
    if (!Object.keys(value || {}).length) {
      return '-';
    }

    const min = getValue(value.min);
    const max = getValue(value.max);

    return `${min}${getMiddle(min, max)}${max}`;
  },
};
