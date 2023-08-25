import { attributesTypes } from '@/modules/organization/types/Attributes';
import OrganizationAttributesJSONRenderer from '@/modules/organization/components/organization-attributes-json-renderer.vue';
import { formatFloatToYears } from '@/utils/number';
import { snakeToSentenceCase } from '@/utils/string';

const AverageTenureByLevel = {
  vp: 'VP',
  cxo: 'CXO',
};

export default {
  name: 'averageTenureByLevel',
  label: 'Average Tenure by Level',
  type: attributesTypes.json,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesJSONRenderer,
  keyParser: (key) => AverageTenureByLevel[key] || snakeToSentenceCase(key),
  valueParser: (value) => formatFloatToYears(value),
};
