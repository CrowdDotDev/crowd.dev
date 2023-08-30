import { attributesTypes } from '@/modules/organization/types/Attributes';

export default {
  name: 'employeeCount',
  label: 'Employee Count',
  type: attributesTypes.number,
  showInForm: true,
  showInAttributes: true,
  displayValue: (value) => value,
};
