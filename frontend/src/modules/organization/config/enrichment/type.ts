import { attributesTypes } from '@/modules/organization/types/Attributes';
import { toSentenceCase } from '@/utils/string';

export default {
  name: 'type',
  label: 'Type',
  type: attributesTypes.string,
  showInForm: true,
  showInAttributes: true,
  displayValue: (value) => toSentenceCase(value),
};
