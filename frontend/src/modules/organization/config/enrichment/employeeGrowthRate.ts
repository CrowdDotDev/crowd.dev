import { AttributeType } from '@/modules/organization/types/Attributes';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/organization-attributes-json-renderer.vue';
import { formatFloatToPercentage } from '@/utils/number';
import { snakeToSentenceCase } from '@/utils/string';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const employeeGrowthRate: OrganizationEnrichmentConfig = {
  name: 'employeeGrowthRate',
  label: 'Employee Growth Rate',
  type: AttributeType.JSON,
  showInForm: true,
  showInAttributes: true,
  enrichmentSneakPeak: true,
  component: OrganizationAttributesJSONRenderer,
  valueParser: formatFloatToPercentage,
  keyParser: (key) => `${snakeToSentenceCase(key)}s`,
  filterValue: (value) => ({ '12_month': value['12_month'] }),
};

export default employeeGrowthRate;
