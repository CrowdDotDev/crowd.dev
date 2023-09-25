import { AttributeType } from '@/modules/organization/types/Attributes';
import OrganizationAttributesArrayRenderer from '@/modules/organization/components/organization-attributes-array-renderer.vue';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const allSubsidiaries: OrganizationEnrichmentConfig = {
  name: 'allSubsidiaries',
  label: 'All subsidiaries',
  type: AttributeType.ARRAY,
  showInForm: true,
  showInAttributes: true,
  component: OrganizationAttributesArrayRenderer,
};

export default allSubsidiaries;
