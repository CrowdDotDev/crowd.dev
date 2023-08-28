import { attributesTypes } from '@/modules/organization/types/Attributes';

export default {
  name: 'ultimateParent',
  label: 'Ultimate Parent',
  type: attributesTypes.string,
  showInForm: true,
  showInAttributes: true,
  displayValue: (value) => value,
};
