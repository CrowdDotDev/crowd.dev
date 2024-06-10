import { AttributeType } from '@/modules/organization/types/Attributes';
import { formatFloatToYears } from '@/utils/number';
import { snakeToSentenceCase } from '@/utils/string';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/details/overview/attributes/organization-attribute-json.vue';

const _averageTenureByRole: OrganizationEnrichmentConfig = {
  name: 'averageTenureByRole',
  label: 'Average Tenure by Role',
  type: AttributeType.JSON,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesJSONRenderer,
  keyParser: (key) => snakeToSentenceCase(key),
  valueParser: (value) => formatFloatToYears(value),
};

export default _averageTenureByRole;
