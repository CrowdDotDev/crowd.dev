import { AttributeType } from '@/modules/organization/types/Attributes';
import { formatFloatToPercentage } from '@/utils/number';
import { snakeToSentenceCase } from '@/utils/string';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/details/overview/attributes/organization-attribute-json.vue';

const _employeeGrowthRate: OrganizationEnrichmentConfig = {
  name: 'employeeGrowthRate',
  label: 'Employee Growth Rate',
  type: AttributeType.JSON,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesJSONRenderer,
  valueParser: formatFloatToPercentage,
  keyParser: (key) => `${snakeToSentenceCase(key)}s`,
  filterValue: (value) => ({ '12_month': value['12_month'] }),
};

export default _employeeGrowthRate;
