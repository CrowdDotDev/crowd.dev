import { AttributeType } from '@/modules/organization/types/Attributes';
import { formatFloatToYears } from '@/utils/number';
import { snakeToSentenceCase } from '@/utils/string';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/details/overview/attributes/organization-attribute-json.vue';

const _averageTenureByLevel: Record<string, string> = {
  vp: 'VP',
  cxo: 'CXO',
};

const averageTenureByLevel: OrganizationEnrichmentConfig = {
  name: 'averageTenureByLevel',
  label: 'Average Tenure by Level',
  type: AttributeType.JSON,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesJSONRenderer,
  keyParser: (key) => _averageTenureByLevel[key] || snakeToSentenceCase(key),
  valueParser: (value) => formatFloatToYears(value),
};

export default averageTenureByLevel;
