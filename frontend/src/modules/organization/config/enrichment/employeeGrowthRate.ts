import { attributesTypes } from '@/modules/organization/types/Attributes';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/organization-attributes-json-renderer.vue';
import { formatFloatToPercentage } from '@/utils/number';
import { snakeToSentenceCase } from '@/utils/string';

export default {
  name: 'employeeGrowthRate',
  label: 'Employee Growth Rate',
  type: attributesTypes.json,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesJSONRenderer,
  keyParser: (key) => snakeToSentenceCase(key),
  valueParser: formatFloatToPercentage,
  filterValue: (value) => ({ '12_month': value['12_month'] }),
};
