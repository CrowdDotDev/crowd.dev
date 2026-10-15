import { AttributeType } from '@/modules/organization/types/Attributes';
import type { OrganizationEnrichmentConfig } from '@/modules/organization/config/enrichment/index';

const naics: OrganizationEnrichmentConfig = {
  name: 'naics',
  label: 'Naics',
  type: AttributeType.STRING,
  showInForm: false,
  showInAttributes: false,
  formatValue: (val) => val,
};

export default naics;
