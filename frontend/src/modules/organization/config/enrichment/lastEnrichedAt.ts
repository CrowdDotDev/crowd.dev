import { attributesTypes } from '@/modules/organization/types/Attributes';
import { formatDate } from '@/utils/date';

export default {
  name: 'lastEnrichedAt',
  label: 'Last enrichment',
  type: attributesTypes.date,
  showInForm: false,
  showInAttributes: true,
  displayValue: (value) => formatDate({
    timestamp: value,
    subtractDays: null,
    subtractMonths: null,
    format: 'D MMMM, YYYY',
  }),
};
