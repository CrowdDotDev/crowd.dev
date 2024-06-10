import { AttributeType } from '@/modules/organization/types/Attributes';
import { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const affiliatedProfiles: OrganizationEnrichmentConfig = {
  name: 'affiliatedProfiles',
  label: 'Affilliated Profiles',
  type: AttributeType.ARRAY,
  showInForm: true,
  showInAttributes: true,
};

export default affiliatedProfiles;
