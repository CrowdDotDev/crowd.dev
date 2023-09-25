import { AttributeType } from '@/modules/organization/types/Attributes';
import OrganizationAttributesArrayRenderer from '@/modules/organization/components/organization-attributes-array-renderer.vue';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const alternativeDomains: OrganizationEnrichmentConfig = {
  name: 'alternativeDomains',
  label: 'Alternative Domains',
  type: AttributeType.ARRAY,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesArrayRenderer,
  isLink: true,
};

export default alternativeDomains;
