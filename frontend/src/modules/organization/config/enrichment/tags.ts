import { AttributeType } from '@/modules/organization/types/Attributes';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const tags: OrganizationEnrichmentConfig = {
  name: 'tags',
  label: 'Tags',
  type: AttributeType.ARRAY,
  showInForm: true,
  showInAttributes: true,
};

export default tags;
