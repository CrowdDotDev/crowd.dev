import { attributesTypes } from '@/modules/organization/types/Attributes';
import { toSentenceCase } from '@/utils/string';

export default {
  name: 'gicsSector',
  label: 'GICS Sector',
  type: attributesTypes.string,
  showInForm: true,
  showInAttributes: true,
  displayValue: (value) => toSentenceCase(value),
};
