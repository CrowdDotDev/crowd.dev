import { AttributeType } from '@/modules/organization/types/Attributes';
import OrganizationAttributesArrayRenderer from '@/modules/organization/components/organization-attributes-array-renderer.vue';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const alternativeNames: OrganizationEnrichmentConfig = {
  name: 'alternativeNames',
  label: 'Alternative Names',
  type: AttributeType.ARRAY,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesArrayRenderer,
};

export default alternativeNames;
