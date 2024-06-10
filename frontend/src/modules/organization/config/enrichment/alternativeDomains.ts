import { AttributeType } from '@/modules/organization/types/Attributes';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const alternativeDomains: OrganizationEnrichmentConfig = {
  name: 'alternativeDomains',
  label: 'Alternative Domains',
  type: AttributeType.ARRAY,
  showInForm: true,
  showInAttributes: true,
  attributes: {
    isLink: true,
  },
};

export default alternativeDomains;
