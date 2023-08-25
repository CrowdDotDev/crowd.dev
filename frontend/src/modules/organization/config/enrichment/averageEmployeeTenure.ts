import { attributesTypes } from '@/modules/organization/types/Attributes';
import { formatFloatToYears } from '@/utils/number';

export default {
  name: 'averageEmployeeTenure',
  label: 'Average Employee Tenure',
  type: attributesTypes.number,
  showInForm: true,
  showInAttributes: true,
  displayValue: (value) => formatFloatToYears(value),
};
