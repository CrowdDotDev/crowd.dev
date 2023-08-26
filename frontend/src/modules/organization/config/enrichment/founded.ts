import { attributesTypes } from '@/modules/organization/types/Attributes';

export default {
  name: 'founded',
  label: 'Founded',
  type: attributesTypes.number,
  showInForm: true,
  showInAttributes: true,
  displayValue: (value) => value,
};
