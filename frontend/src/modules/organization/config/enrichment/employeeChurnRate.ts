import { attributesTypes } from '@/modules/organization/types/Attributes';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/organization-attributes-json-renderer.vue';
import { formatFloatToPercentage } from '@/utils/number';
import { snakeToSentenceCase } from '@/utils/string';

export default {
  name: 'employeeChurnRate',
  label: 'Employee Churn Rate',
  type: attributesTypes.json,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesJSONRenderer,
  keyParser: (key) => snakeToSentenceCase(key),
  valueParser: formatFloatToPercentage,
};
