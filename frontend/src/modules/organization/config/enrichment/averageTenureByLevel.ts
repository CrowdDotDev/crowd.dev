import { AttributeType } from '@/modules/organization/types/Attributes';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/organization-attributes-json-renderer.vue';
import { formatFloatToYears } from '@/utils/number';
import { snakeToSentenceCase } from '@/utils/string';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const AverageTenureByLevel: Record<string, string> = {
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
  keyParser: (key) => AverageTenureByLevel[key] || snakeToSentenceCase(key),
  valueParser: (value) => formatFloatToYears(value),
};

export default averageTenureByLevel;
