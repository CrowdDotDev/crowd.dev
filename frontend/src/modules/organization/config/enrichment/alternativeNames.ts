import { AttributeType } from '@/modules/organization/types/Attributes';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const alternativeNames: OrganizationEnrichmentConfig = {
  name: 'alternativeNames',
  label: 'Alternative Names',
  type: AttributeType.ARRAY,
  showInForm: true,
  showInAttributes: true,
};

export default alternativeNames;
