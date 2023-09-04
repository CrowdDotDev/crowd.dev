import { attributesTypes } from '@/modules/organization/types/Attributes';
import { toSentenceCase } from '@/utils/string';

export default {
  name: 'size',
  label: 'Headcount',
  type: attributesTypes.string,
  showInForm: true,
  showInAttributes: false,
  displayValue: (value) => toSentenceCase(value),
};
