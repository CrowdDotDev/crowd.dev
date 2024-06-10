import { AttributeType } from '@/modules/organization/types/Attributes';
import { formatFloatToPercentage, formatFloatToYears } from '@/utils/number';
import { snakeToSentenceCase } from '@/utils/string';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/details/overview/attributes/organization-attribute-json.vue';

const employeeChurnRate: OrganizationEnrichmentConfig = {
  name: 'employeeChurnRate',
  label: 'Employee Churn Rate',
  type: AttributeType.JSON,
  showInForm: true,
  showInAttributes: true,
  formatValue: (val) => ({
    [`${snakeToSentenceCase('12_month')}s`]: formatFloatToPercentage(val['12_month']),
  }),
};

export default employeeChurnRate;
