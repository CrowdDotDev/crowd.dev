import { attributesTypes } from '@/modules/organization/types/Attributes';

export default {
  name: 'immediateParent',
  label: 'Immediate Parent',
  type: attributesTypes.string,
  showInForm: true,
  showInAttributes: true,
  displayValue: (value) => value,
};
