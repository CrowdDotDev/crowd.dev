import { AttributeType } from '@/modules/organization/types/Attributes';
import { formatFloatToPercentage } from '@/utils/number';
import { snakeToSentenceCase, toSentenceCase } from '@/utils/string';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/details/overview/attributes/organization-attribute-json.vue';

const employeeGrowthRate: OrganizationEnrichmentConfig = {
  name: 'employeeGrowthRate',
  label: 'Employee Growth Rate',
  type: AttributeType.JSON,
  showInForm: true,
  showInAttributes: true,
  formatValue: (val) => ({
    [`${snakeToSentenceCase('12_month')}s`]: formatFloatToPercentage(val['12_month']),
  }),
};

export default employeeGrowthRate;
