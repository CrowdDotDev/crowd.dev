import { AttributeType } from '@/modules/organization/types/Attributes';
import OrganizationAttributesArrayRenderer from '@/modules/organization/components/organization-attributes-array-renderer.vue';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const tags: OrganizationEnrichmentConfig = {
  name: 'tags',
  label: 'Tags',
  type: AttributeType.ARRAY,
  showInForm: true,
  showInAttributes: true,
  enrichmentSneakPeak: true,
  component: OrganizationAttributesArrayRenderer,
};

export default tags;
